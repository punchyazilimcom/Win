package com.punchyazilim.kefobaba.service

import com.punchyazilim.kefobaba.data.AppEvent
import com.punchyazilim.kefobaba.data.FirebaseRepository
import com.punchyazilim.kefobaba.data.SettingsRepository
import com.punchyazilim.kefobaba.util.InstalledAppsLoader
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Hem Erişilebilirlik servisi hem de UsageStats yoklayıcısı bu tek noktaya bildirir.
 * Merkezî 60 sn debounce sayesinde aynı açılış iki kaynaktan gelse de tek olay yazılır.
 */
@Singleton
class DetectionCoordinator @Inject constructor(
    private val settings: SettingsRepository,
    private val repo: FirebaseRepository,
    private val appsLoader: InstalledAppsLoader
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val lastSeen = HashMap<String, Long>()

    /** Bir uygulamanın öne geldiği bilgisi geldiğinde çağrılır. */
    fun onAppForeground(packageName: String) {
        val monitored = settings.monitoredPackages.value
        if (packageName !in monitored) return

        val now = System.currentTimeMillis()
        synchronized(lastSeen) {
            val previous = lastSeen[packageName] ?: 0L
            if (now - previous < DEBOUNCE_MS) return
            lastSeen[packageName] = now
        }
        writeEvent(packageName, now)
    }

    private fun writeEvent(packageName: String, timestamp: Long) {
        scope.launch {
            val familyId = settings.familyIdFlow.first() ?: return@launch
            val deviceId = settings.deviceIdFlow.first() ?: return@launch
            val deviceName = settings.deviceNameFlow.first() ?: "Çocuk cihazı"
            val appName = appsLoader.appLabel(packageName)
            runCatching {
                repo.writeEvent(
                    familyId,
                    AppEvent(
                        packageName = packageName,
                        appName = appName,
                        timestamp = timestamp,
                        childDeviceId = deviceId,
                        childDeviceName = deviceName
                    )
                )
            }
        }
    }

    companion object {
        private const val DEBOUNCE_MS = 60_000L
    }
}
