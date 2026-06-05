package com.punchyazilim.kefobaba.util

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import com.punchyazilim.kefobaba.data.InstalledApp
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/** Cihazda kullanıcı tarafından başlatılabilen uygulamaları yükler (uygulama seçici). */
@Singleton
class InstalledAppsLoader @Inject constructor(
    @ApplicationContext private val context: Context
) {
    suspend fun loadLaunchableApps(): List<InstalledApp> = withContext(Dispatchers.IO) {
        val pm = context.packageManager
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val resolveInfos = pm.queryIntentActivities(intent, 0)
        resolveInfos
            .asSequence()
            .map { it.activityInfo.packageName }
            .distinct()
            .filter { it != context.packageName } // kendimizi gösterme
            .map { pkg ->
                val label = runCatching {
                    pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
                }.getOrDefault(pkg)
                InstalledApp(packageName = pkg, appName = label)
            }
            .sortedBy { it.appName.lowercase() }
            .toList()
    }

    /** Tek bir paketin görünen adını döndürür. */
    fun appLabel(packageName: String): String {
        val pm = context.packageManager
        return runCatching {
            pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0)).toString()
        }.getOrDefault(packageName)
    }
}
