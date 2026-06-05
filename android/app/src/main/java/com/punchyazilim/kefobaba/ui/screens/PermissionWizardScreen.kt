package com.punchyazilim.kefobaba.ui.screens

import android.Manifest
import android.content.Context
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.punchyazilim.kefobaba.ui.components.PunchPrimaryButton
import com.punchyazilim.kefobaba.ui.theme.PunchAccent
import com.punchyazilim.kefobaba.ui.theme.PunchBorder
import com.punchyazilim.kefobaba.ui.theme.PunchSuccess
import com.punchyazilim.kefobaba.ui.theme.PunchSurface
import com.punchyazilim.kefobaba.ui.theme.PunchTextMuted
import com.punchyazilim.kefobaba.ui.theme.PunchTextSecondary
import com.punchyazilim.kefobaba.util.PermissionsHelper

@Composable
fun PermissionWizardScreen(
    onFinished: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    // Her ON_RESUME'da yeniden kontrol için tetikleyici.
    var refresh by remember { mutableIntStateOf(0) }
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) refresh++
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val notifLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { refresh++ }

    // refresh değiştiğinde yeniden hesaplanması için referans.
    @Suppress("UNUSED_EXPRESSION") refresh

    val hasUsage = PermissionsHelper.hasUsageAccess(context)
    val hasAccessibility = PermissionsHelper.isAccessibilityEnabled(context)
    val hasNotif = notificationsGranted(context)
    val hasBattery = PermissionsHelper.isIgnoringBatteryOptimizations(context)
    val hasAdmin = PermissionsHelper.isDeviceAdminActive(context)

    val allReady = hasUsage && hasAccessibility && hasNotif

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp)
    ) {
        Spacer(Modifier.height(16.dp))
        Text(
            "Kurulum Sihirbazı",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "İzlemenin güvenilir çalışması için aşağıdaki izinleri sırayla verin. " +
                "Her adım için açıklama ve ayarlara giden buton var.",
            style = MaterialTheme.typography.bodyMedium,
            color = PunchTextSecondary
        )
        Spacer(Modifier.height(20.dp))

        PermissionStep(
            index = 1,
            title = "Uygulama Kullanım Erişimi",
            description = "Hangi uygulamanın açıldığını tespit etmek için gereklidir.",
            granted = hasUsage,
            onClick = { context.startActivitySafe(PermissionsHelper.usageAccessIntent()) }
        )
        PermissionStep(
            index = 2,
            title = "Erişilebilirlik Servisi",
            description = "Uygulama açılışlarını anında yakalar. Ekran içeriği kaydedilmez.",
            granted = hasAccessibility,
            onClick = { context.startActivitySafe(PermissionsHelper.accessibilityIntent()) }
        )
        PermissionStep(
            index = 3,
            title = "Bildirim İzni",
            description = "Kalıcı \"İzleme aktif\" bildirimi gösterebilmek için gereklidir.",
            granted = hasNotif,
            onClick = {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    notifLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }
        )
        PermissionStep(
            index = 4,
            title = "Pil Optimizasyonu Muafiyeti",
            description = "İzlemenin arka planda kapanmaması için önerilir.",
            granted = hasBattery,
            optional = true,
            onClick = {
                context.startActivitySafe(PermissionsHelper.batteryOptimizationIntent(context))
            }
        )
        PermissionStep(
            index = 5,
            title = "Kaldırma Koruması (Device Admin)",
            description = "Uygulamanın PIN olmadan kaldırılmasını engeller. Önerilir.",
            granted = hasAdmin,
            optional = true,
            onClick = {
                context.startActivitySafe(
                    PermissionsHelper.deviceAdminIntent(
                        context,
                        "Kefo Baba Takipte'nin izinsiz kaldırılmasını engellemek için."
                    )
                )
            }
        )

        Spacer(Modifier.height(24.dp))
        PunchPrimaryButton(
            text = if (allReady) "İzlemeyi Başlat" else "Zorunlu izinleri tamamlayın",
            onClick = onFinished,
            enabled = allReady,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "1–3 zorunlu, 4–5 önerilir.",
            style = MaterialTheme.typography.bodyMedium,
            color = PunchTextMuted,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

private fun notificationsGranted(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return true
    return ContextCompat.checkSelfPermission(
        context, Manifest.permission.POST_NOTIFICATIONS
    ) == android.content.pm.PackageManager.PERMISSION_GRANTED
}

private fun Context.startActivitySafe(intent: android.content.Intent) {
    intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
    runCatching { startActivity(intent) }
}

@Composable
private fun PermissionStep(
    index: Int,
    title: String,
    description: String,
    granted: Boolean,
    optional: Boolean = false,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = PunchSurface),
        border = BorderStroke(1.dp, PunchBorder)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = if (granted) Icons.Filled.CheckCircle
                else Icons.Filled.RadioButtonUnchecked,
                contentDescription = null,
                tint = if (granted) PunchSuccess else PunchTextMuted,
                modifier = Modifier.size(28.dp)
            )
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "$index. $title",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (optional) {
                        Spacer(Modifier.width(8.dp))
                        Text(
                            "(önerilir)",
                            style = MaterialTheme.typography.labelSmall.copy(),
                            color = PunchTextMuted
                        )
                    }
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = PunchTextSecondary
                )
                if (!granted) {
                    TextButton(
                        onClick = onClick,
                        contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp)
                    ) {
                        Text("Ayarlara git", color = PunchAccent)
                    }
                }
            }
        }
    }
}
