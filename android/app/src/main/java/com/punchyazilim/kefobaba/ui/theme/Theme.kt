package com.punchyazilim.kefobaba.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val KefoDarkColors = darkColorScheme(
    primary = PunchAccent,
    onPrimary = PunchBlack,
    secondary = PunchAccent,
    onSecondary = PunchBlack,
    background = PunchBackground,
    onBackground = PunchTextPrimary,
    surface = PunchSurface,
    onSurface = PunchTextPrimary,
    surfaceVariant = PunchSurfaceVariant,
    onSurfaceVariant = PunchTextSecondary,
    outline = PunchBorder,
    error = PunchError,
    onError = PunchBlack
)

@Composable
fun KefoTheme(
    // Uygulama her zaman koyu temada — marka gereği.
    @Suppress("UNUSED_PARAMETER") darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = KefoDarkColors
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = KefoTypography,
        content = content
    )
}
