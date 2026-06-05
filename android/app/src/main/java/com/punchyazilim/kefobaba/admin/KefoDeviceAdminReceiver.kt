package com.punchyazilim.kefobaba.admin

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent

/**
 * Device Admin alıcısı. Uygulama device admin iken doğrudan kaldırılamaz; önce uygulama
 * içinde PIN doğrulamasıyla admin kapatılmalıdır (bkz. PinScreen / Dashboard).
 *
 * Cihazı kilitleme/silme gibi yıkıcı yetkiler İSTENMEZ — yalnızca kaldırma koruması.
 */
class KefoDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        // Koruma etkin.
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        // Kullanıcı admin'i kapatmaya çalıştığında gösterilecek uyarı.
        return "Kaldırma koruması kapatılmak üzere. Bu işlem yalnızca ebeveyn PIN'i ile " +
            "yapılmalıdır. Devam ederseniz uygulama kaldırılabilir hale gelir."
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        // Koruma kapatıldı.
    }
}
