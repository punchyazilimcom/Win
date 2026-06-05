package com.punchyazilim.kefobaba.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.punchyazilim.kefobaba.ui.components.BrandLogo
import com.punchyazilim.kefobaba.ui.components.PunchPrimaryButton
import com.punchyazilim.kefobaba.ui.theme.PunchError
import com.punchyazilim.kefobaba.ui.theme.PunchTextSecondary

@Composable
fun ParentSetupScreen(
    onSetupComplete: () -> Unit,
    vm: OnboardingViewModel = hiltViewModel()
) {
    val ui by vm.ui.collectAsStateWithLifecycle()
    var name by remember { mutableStateOf("Ebeveyn telefonu") }

    LaunchedEffect(ui.done) {
        if (ui.done) onSetupComplete()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(32.dp))
        BrandLogo(logoSize = 110)
        Spacer(Modifier.height(28.dp))
        Text(
            "Ebeveyn Kurulumu",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "Yeni bir aile hesabı oluşturulacak. Sonraki adımda PIN belirleyip " +
                "çocuk cihazını eşleştireceksiniz.",
            style = MaterialTheme.typography.bodyMedium,
            color = PunchTextSecondary,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(28.dp))

        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Bu cihazın adı") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        ui.error?.let {
            Spacer(Modifier.height(12.dp))
            Text(it, color = PunchError, style = MaterialTheme.typography.bodyMedium)
        }

        Spacer(Modifier.height(24.dp))
        PunchPrimaryButton(
            text = "Aileyi Oluştur",
            onClick = { vm.setupParent(name.ifBlank { "Ebeveyn telefonu" }) },
            loading = ui.loading,
            modifier = Modifier.fillMaxWidth()
        )
    }
}
