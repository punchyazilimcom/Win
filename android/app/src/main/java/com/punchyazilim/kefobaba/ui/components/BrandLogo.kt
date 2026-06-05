package com.punchyazilim.kefobaba.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.Spacer
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.punchyazilim.kefobaba.R
import com.punchyazilim.kefobaba.ui.theme.PunchTextMuted

/**
 * Ortada logo + hemen altında düz yazı imza "PUNCH YAZILIM".
 * İmza: küçük punto, geniş harf aralığı, gri ton, ortalanmış.
 */
@Composable
fun BrandLogo(
    modifier: Modifier = Modifier,
    logoSize: Int = 140
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Image(
            painter = painterResource(id = R.drawable.logo_basak),
            contentDescription = "Başak Kır Pidesi logosu",
            modifier = Modifier.size(logoSize.dp)
        )
        Spacer(Modifier.height(12.dp))
        Text(
            text = stringResource(id = R.string.brand_signature),
            style = MaterialTheme.typography.labelSmall,
            color = PunchTextMuted
        )
    }
}
