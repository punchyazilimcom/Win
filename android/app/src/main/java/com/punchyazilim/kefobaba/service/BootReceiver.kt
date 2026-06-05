package com.punchyazilim.kefobaba.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.punchyazilim.kefobaba.data.DeviceRole
import com.punchyazilim.kefobaba.data.SettingsRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

/** Cihaz yeniden başladığında, çocuk modundaysa izleme servisini yeniden başlatır. */
@AndroidEntryPoint
class BootReceiver : BroadcastReceiver() {

    @Inject lateinit var settings: SettingsRepository

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED &&
            action != Intent.ACTION_LOCKED_BOOT_COMPLETED
        ) return

        val pending = goAsync()
        CoroutineScope(Dispatchers.Default).launch {
            try {
                val role = settings.roleFlow.first()
                if (role == DeviceRole.CHILD) {
                    MonitoringForegroundService.start(context)
                }
            } finally {
                pending.finish()
            }
        }
    }
}
