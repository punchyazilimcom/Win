package com.punchyazilim.kefobaba.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.punchyazilim.kefobaba.ui.components.PunchPrimaryButton
import com.punchyazilim.kefobaba.ui.theme.PunchError
import com.punchyazilim.kefobaba.ui.theme.PunchSuccess
import com.punchyazilim.kefobaba.ui.theme.PunchTextSecondary

/** Ebeveyn: PIN belirleme / değiştirme. */
@Composable
fun PinSetupScreen(
    onDone: () -> Unit,
    vm: PinViewModel = hiltViewModel()
) {
    val ui by vm.ui.collectAsStateWithLifecycle()
    var pin by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }

    LaunchedEffect(ui.success) { if (ui.success) onDone() }

    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(40.dp))
        Text(
            "PIN Belirle",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "Bu PIN, çocuk cihazında kaldırma korumasını kapatmak için kullanılacak. " +
                "Hash'lenerek güvenli saklanır.",
            style = MaterialTheme.typography.bodyMedium,
            color = PunchTextSecondary,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(28.dp))
        PinField(value = pin, onChange = { pin = it }, label = "Yeni PIN (en az 4 hane)")
        Spacer(Modifier.height(16.dp))
        PinField(value = confirm, onChange = { confirm = it }, label = "PIN tekrar")

        ui.error?.let {
            Spacer(Modifier.height(12.dp))
            Text(it, color = PunchError, style = MaterialTheme.typography.bodyMedium)
        }
        Spacer(Modifier.height(24.dp))
        PunchPrimaryButton(
            text = "PIN'i Kaydet",
            onClick = { vm.setPin(pin, confirm) },
            loading = ui.loading,
            enabled = pin.length >= 4,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

/** Çocuk: koruma kaldırma için PIN doğrulama. */
@Composable
fun PinVerifyScreen(
    onUnlocked: () -> Unit,
    vm: PinViewModel = hiltViewModel()
) {
    val ui by vm.ui.collectAsStateWithLifecycle()
    var pin by remember { mutableStateOf("") }

    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(48.dp))
        Text(
            "Koruma Kaldırma",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "Kaldırma korumasını kapatmak için ebeveyn PIN'ini girin. Doğru PIN " +
                "girildiğinde uygulama kaldırılabilir hale gelir.",
            style = MaterialTheme.typography.bodyMedium,
            color = PunchTextSecondary,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(28.dp))
        PinField(value = pin, onChange = { pin = it }, label = "PIN")

        ui.error?.let {
            Spacer(Modifier.height(12.dp))
            Text(it, color = PunchError, style = MaterialTheme.typography.bodyMedium)
        }
        if (ui.success) {
            Spacer(Modifier.height(12.dp))
            Text(
                "Koruma kaldırıldı. Uygulamayı artık kaldırabilirsiniz.",
                color = PunchSuccess,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center
            )
        }
        Spacer(Modifier.height(24.dp))
        PunchPrimaryButton(
            text = "Doğrula ve Korumayı Kaldır",
            onClick = { vm.verifyAndUnlock(pin) },
            loading = ui.loading,
            enabled = pin.length >= 4,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun PinField(value: String, onChange: (String) -> Unit, label: String) {
    OutlinedTextField(
        value = value,
        onValueChange = { if (it.length <= 8 && it.all { c -> c.isDigit() }) onChange(it) },
        label = { Text(label) },
        singleLine = true,
        visualTransformation = PasswordVisualTransformation(),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
        modifier = Modifier.fillMaxWidth()
    )
}
