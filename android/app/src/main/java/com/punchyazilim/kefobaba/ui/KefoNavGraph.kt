package com.punchyazilim.kefobaba.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.punchyazilim.kefobaba.service.MonitoringForegroundService
import com.punchyazilim.kefobaba.ui.screens.AppPickerScreen
import com.punchyazilim.kefobaba.ui.screens.ChildHomeScreen
import com.punchyazilim.kefobaba.ui.screens.ChildPairScreen
import com.punchyazilim.kefobaba.ui.screens.ParentDashboardScreen
import com.punchyazilim.kefobaba.ui.screens.ParentSetupScreen
import com.punchyazilim.kefobaba.ui.screens.PermissionWizardScreen
import com.punchyazilim.kefobaba.ui.screens.PinSetupScreen
import com.punchyazilim.kefobaba.ui.screens.PinVerifyScreen
import com.punchyazilim.kefobaba.ui.screens.WelcomeScreen

@Composable
fun KefoNavGraph(startDestination: String) {
    val navController = rememberNavController()
    val context = LocalContext.current

    NavHost(navController = navController, startDestination = startDestination) {

        composable(Routes.WELCOME) {
            WelcomeScreen(
                onSelectParent = { navController.navigate(Routes.ROLE_PARENT_SETUP) },
                onSelectChild = { navController.navigate(Routes.ROLE_CHILD_PAIR) }
            )
        }

        // --- Ebeveyn akışı ---
        composable(Routes.ROLE_PARENT_SETUP) {
            ParentSetupScreen(
                onSetupComplete = {
                    // Önce PIN belirlet, sonra dashboard'a geç.
                    navController.navigate(Routes.PIN_SETUP) {
                        popUpTo(Routes.WELCOME) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.PIN_SETUP) {
            PinSetupScreen(
                onDone = {
                    navController.navigate(Routes.PARENT_DASHBOARD) {
                        popUpTo(Routes.PIN_SETUP) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.PARENT_DASHBOARD) {
            ParentDashboardScreen(
                onAddApps = { navController.navigate(Routes.APP_PICKER) },
                onManagePin = { navController.navigate(Routes.PIN_SETUP) }
            )
        }

        composable(Routes.APP_PICKER) {
            AppPickerScreen(onBack = { navController.popBackStack() })
        }

        // --- Çocuk akışı ---
        composable(Routes.ROLE_CHILD_PAIR) {
            ChildPairScreen(
                onPaired = {
                    navController.navigate(Routes.PERMISSIONS) {
                        popUpTo(Routes.WELCOME) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.PERMISSIONS) {
            PermissionWizardScreen(
                onFinished = {
                    MonitoringForegroundService.start(context)
                    navController.navigate(Routes.CHILD_HOME) {
                        popUpTo(Routes.PERMISSIONS) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.CHILD_HOME) {
            // Çocuk ekranı açıldığında servisin ayakta olduğundan emin ol.
            LaunchedEffect(Unit) { MonitoringForegroundService.start(context) }
            ChildHomeScreen(
                onManageProtection = { navController.navigate(Routes.PIN_VERIFY) }
            )
        }

        composable(Routes.PIN_VERIFY) {
            PinVerifyScreen(onUnlocked = { /* kullanıcı kaldırabilir; ekranda kalır */ })
        }
    }
}
