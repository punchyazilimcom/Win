package com.punchyazilim.kefobaba.ui

/** Uygulama içi navigasyon rotaları. */
object Routes {
    const val WELCOME = "welcome"
    const val ROLE_PARENT_SETUP = "parent_setup"   // ebeveyn ilk kurulum (aile + kod)
    const val ROLE_CHILD_PAIR = "child_pair"       // çocuk kod girişi
    const val PERMISSIONS = "permissions"          // izin sihirbazı (çocuk)
    const val PARENT_DASHBOARD = "parent_dashboard"
    const val CHILD_HOME = "child_home"
    const val APP_PICKER = "app_picker"
    const val PIN_SETUP = "pin_setup"              // ebeveyn PIN belirler
    const val PIN_VERIFY = "pin_verify"            // koruma kapatma için PIN doğrula
}
