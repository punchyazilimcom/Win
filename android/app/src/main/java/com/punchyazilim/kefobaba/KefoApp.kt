package com.punchyazilim.kefobaba

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import com.punchyazilim.kefobaba.R
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class KefoApp : Application() {

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        val nm = getSystemService(NotificationManager::class.java)

        // Ebeveyne gelen uygulama açılış uyarıları
        val alerts = NotificationChannel(
            getString(R.string.fcm_channel_id),
            getString(R.string.fcm_channel_name),
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "İzlenen bir uygulama açıldığında bildirim alın."
        }

        // İzlenen cihazda kalıcı 'İzleme aktif' bildirimi (şeffaflık)
        val monitor = NotificationChannel(
            getString(R.string.monitor_channel_id),
            getString(R.string.monitor_channel_name),
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "İzlemenin açık olduğunu gösteren kalıcı durum bildirimi."
            setShowBadge(false)
        }

        nm.createNotificationChannel(alerts)
        nm.createNotificationChannel(monitor)
    }
}
