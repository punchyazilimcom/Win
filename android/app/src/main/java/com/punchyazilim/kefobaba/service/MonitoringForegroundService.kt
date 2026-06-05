package com.punchyazilim.kefobaba.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.punchyazilim.kefobaba.MainActivity
import com.punchyazilim.kefobaba.R
import com.punchyazilim.kefobaba.data.FirebaseRepository
import com.punchyazilim.kefobaba.data.SettingsRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * İzlenen cihazda sürekli çalışan servis (şeffaf, kalıcı bildirimli).
 *
 * Görevleri:
 *  1. "İzleme aktif" kalıcı bildirimini gösterir (gizlilik YOK).
 *  2. Firestore'daki izlenen uygulamalar listesini yerel önbelleğe senkronlar.
 *  3. UsageStats ile yedek tespit yapar (Erişilebilirlik servisini tamamlar).
 */
@AndroidEntryPoint
class MonitoringForegroundService : Service() {

    @Inject lateinit var settings: SettingsRepository
    @Inject lateinit var repo: FirebaseRepository
    @Inject lateinit var coordinator: DetectionCoordinator

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var syncJob: Job? = null
    private var pollJob: Job? = null

    override fun onCreate() {
        super.onCreate()
        startForeground(NOTIFICATION_ID, buildNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startMonitoredAppsSync()
        startUsageStatsPolling()
        return START_STICKY
    }

    /** Firestore izlenen uygulamalar -> yerel önbellek. */
    private fun startMonitoredAppsSync() {
        if (syncJob?.isActive == true) return
        syncJob = scope.launch {
            settings.warmMonitoredCache()
            val familyId = settings.familyIdFlow.first() ?: return@launch
            repo.observeMonitoredApps(familyId).collect { apps ->
                val enabled = apps.filter { it.enabled }.map { it.packageName }.toSet()
                settings.setMonitoredPackages(enabled)
            }
        }
    }

    /** UsageStats ile öne gelen uygulamayı periyodik kontrol (yedek tespit). */
    private fun startUsageStatsPolling() {
        if (pollJob?.isActive == true) return
        val usm = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        pollJob = scope.launch {
            var lastPkg: String? = null
            while (isActive) {
                val now = System.currentTimeMillis()
                val events = usm.queryEvents(now - POLL_WINDOW_MS, now)
                val e = android.app.usage.UsageEvents.Event()
                var latestPkg: String? = null
                while (events.hasNextEvent()) {
                    events.getNextEvent(e)
                    if (e.eventType == android.app.usage.UsageEvents.Event.MOVE_TO_FOREGROUND ||
                        e.eventType == android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED
                    ) {
                        latestPkg = e.packageName
                    }
                }
                if (latestPkg != null && latestPkg != lastPkg && latestPkg != packageName) {
                    lastPkg = latestPkg
                    coordinator.onAppForeground(latestPkg)
                }
                delay(POLL_INTERVAL_MS)
            }
        }
    }

    private fun buildNotification(): Notification {
        val openIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        return NotificationCompat.Builder(this, getString(R.string.monitor_channel_id))
            .setContentTitle(getString(R.string.monitor_notification_title))
            .setContentText(getString(R.string.monitor_notification_text))
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setOngoing(true)
            .setContentIntent(openIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }

    companion object {
        private const val NOTIFICATION_ID = 1001
        private const val POLL_INTERVAL_MS = 3_000L
        private const val POLL_WINDOW_MS = 10_000L

        fun start(context: Context) {
            val intent = Intent(context, MonitoringForegroundService::class.java)
            context.startForegroundService(intent)
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, MonitoringForegroundService::class.java))
        }
    }
}
