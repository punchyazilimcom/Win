package com.punchyazilim.kefobaba.service

import android.app.PendingIntent
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.punchyazilim.kefobaba.MainActivity
import com.punchyazilim.kefobaba.R
import com.punchyazilim.kefobaba.data.FirebaseRepository
import com.punchyazilim.kefobaba.data.SettingsRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Ebeveyn cihazına Cloud Function tarafından gönderilen push'ları alır ve gösterir.
 * FCM server key İSTEMCİDE TUTULMAZ — push yalnızca Cloud Function tarafından atılır.
 */
@AndroidEntryPoint
class KefoMessagingService : FirebaseMessagingService() {

    @Inject lateinit var repo: FirebaseRepository
    @Inject lateinit var settings: SettingsRepository

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        scope.launch {
            val familyId = settings.familyIdFlow.first() ?: return@launch
            val deviceId = settings.deviceIdFlow.first() ?: return@launch
            runCatching { repo.updateFcmToken(familyId, deviceId, token) }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        val title = message.notification?.title
            ?: message.data["title"]
            ?: "Uygulama açıldı"
        val body = message.notification?.body
            ?: message.data["body"]
            ?: ""

        if (NotificationManagerCompat.from(this).areNotificationsEnabled()) {
            showNotification(title, body)
        }
    }

    private fun showNotification(title: String, body: String) {
        val openIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val notification = NotificationCompat.Builder(this, getString(R.string.fcm_channel_id))
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setAutoCancel(true)
            .setContentIntent(openIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
        NotificationManagerCompat.from(this)
            .notify(System.currentTimeMillis().toInt(), notification)
    }
}
