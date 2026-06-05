package com.punchyazilim.kefobaba

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.punchyazilim.kefobaba.ui.AppViewModel
import com.punchyazilim.kefobaba.ui.KefoNavGraph
import com.punchyazilim.kefobaba.ui.theme.KefoTheme
import com.punchyazilim.kefobaba.ui.theme.PunchBackground
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        var keepSplash = true
        splash.setKeepOnScreenCondition { keepSplash }

        setContent {
            KefoTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = PunchBackground
                ) {
                    Root(onReady = { keepSplash = false })
                }
            }
        }
    }
}

@Composable
private fun Root(onReady: () -> Unit) {
    val vm: AppViewModel = hiltViewModel()
    val state by vm.state.collectAsStateWithLifecycle()

    if (state.ready) {
        onReady()
        KefoNavGraph(
            startDestination = vm.startDestination(state)
        )
    }
}
