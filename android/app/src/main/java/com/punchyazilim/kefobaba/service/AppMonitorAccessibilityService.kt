package com.punchyazilim.kefobaba.service

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import com.punchyazilim.kefobaba.data.SettingsRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * Çekirdek tespit (1/2). TYPE_WINDOW_STATE_CHANGED olaylarını dinler; öne gelen paketi
 * [DetectionCoordinator]'a bildirir. Debounce ve olay yazma orada merkezîdir.
 *
 * Ekran içeriği OKUNMAZ/KAYDEDİLMEZ — yalnızca paket adı kullanılır.
 */
@AndroidEntryPoint
class AppMonitorAccessibilityService : AccessibilityService() {

    @Inject lateinit var settings: SettingsRepository
    @Inject lateinit var coordinator: DetectionCoordinator

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var lastForegroundPackage: String? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        scope.launch { settings.warmMonitoredCache() }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

        val pkg = event.packageName?.toString() ?: return
        if (pkg == packageName) return
        if (pkg == lastForegroundPackage) return
        lastForegroundPackage = pkg

        coordinator.onAppForeground(pkg)
    }

    override fun onInterrupt() { /* no-op */ }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
    }
}
