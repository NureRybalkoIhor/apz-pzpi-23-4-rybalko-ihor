package com.rybalko.foodpreordermobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.rybalko.foodpreordermobile.data.SessionManager
import com.rybalko.foodpreordermobile.ui.viewmodel.OrderState
import com.rybalko.foodpreordermobile.ui.viewmodel.OrderViewModel
import com.rybalko.foodpreordermobile.validation.PaymentValidator

private val DarkBg = Color(0xFF1A1A2E)
private val CardBg = Color(0xFF16213E)
private val Accent = Color(0xFFE94560)
private val InputBg = Color(0xFF0F3460)
private val TextSecondary = Color(0xFF8892B0)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentScreen(
    token: String,
    orderId: Int,
    onBack: () -> Unit,
    onPaymentSuccess: () -> Unit,
    viewModel: OrderViewModel = viewModel()
) {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val savedCard by sessionManager.savedCardNumberFlow.collectAsState(initial = null)
    val savedExpiry by sessionManager.savedCardExpiryFlow.collectAsState(initial = null)
    val savedCvv by sessionManager.savedCardCvvFlow.collectAsState(initial = null)

    var cardNumber by remember { mutableStateOf("") }
    var expiry by remember { mutableStateOf("") }
    var cvv by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var saveCard by remember { mutableStateOf(true) }

    val orderState by viewModel.state.collectAsState()

    LaunchedEffect(savedCard, savedExpiry, savedCvv) {
        if (!savedCard.isNullOrEmpty()) cardNumber = savedCard!!
        if (!savedExpiry.isNullOrEmpty()) expiry = savedExpiry!!
        if (!savedCvv.isNullOrEmpty()) cvv = savedCvv!!
    }

    LaunchedEffect(orderState) {
        if (orderState is OrderState.PaymentSuccess) {
            if (saveCard) {
                sessionManager.saveCardDetails(cardNumber, expiry, cvv)
            } else {
                sessionManager.saveCardDetails("", "", "")
            }
            viewModel.resetState()
            onPaymentSuccess()
        }
    }

    Scaffold(
        containerColor = DarkBg,
        topBar = {
            TopAppBar(
                title = { Text("Оплата замовлення #$orderId", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Назад", tint = Color.White) }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBg)
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(CardBg)
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(Icons.Default.CreditCard, null, tint = Accent, modifier = Modifier.size(48.dp))
                Spacer(Modifier.height(16.dp))
                Text("Введіть дані картки", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Spacer(Modifier.height(8.dp))
                Text("Тестовий платіж (гроші не знімаються)", fontSize = 12.sp, color = TextSecondary)
                Spacer(Modifier.height(24.dp))

                OutlinedTextField(
                    value = cardNumber,
                    onValueChange = { if (it.length <= 16) cardNumber = it.filter { char -> char.isDigit() } },
                    label = { Text("Номер картки", color = TextSecondary) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Accent, unfocusedBorderColor = InputBg,
                        focusedTextColor = Color.White, unfocusedTextColor = Color.White
                    ),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(Modifier.height(16.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    OutlinedTextField(
                        value = expiry,
                        onValueChange = { raw ->
                            val digits = raw.filter { it.isDigit() }.take(4)
                            expiry = when {
                                digits.length <= 2 -> digits
                                else -> "${digits.take(2)}/${digits.drop(2)}"
                            }
                        },
                        label = { Text("ММ/РР", color = TextSecondary) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Accent, unfocusedBorderColor = InputBg,
                            focusedTextColor = Color.White, unfocusedTextColor = Color.White
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )

                    OutlinedTextField(
                        value = cvv,
                        onValueChange = { if (it.length <= 3) cvv = it.filter { char -> char.isDigit() } },
                        label = { Text("CVV", color = TextSecondary) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Accent, unfocusedBorderColor = InputBg,
                            focusedTextColor = Color.White, unfocusedTextColor = Color.White
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )
                }

                Spacer(Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = saveCard,
                        onCheckedChange = { saveCard = it },
                        colors = CheckboxDefaults.colors(checkedColor = Accent, checkmarkColor = Color.White, uncheckedColor = TextSecondary)
                    )
                    Text("Зберегти картку для майбутніх покупок", color = TextSecondary, fontSize = 14.sp)
                }

                Spacer(Modifier.height(8.dp))

                if (errorMessage != null) {
                    Text(errorMessage!!, color = Color(0xFFFF6B6B), fontSize = 13.sp)
                    Spacer(Modifier.height(16.dp))
                }

                if (orderState is OrderState.Error) {
                    Text((orderState as OrderState.Error).message, color = Color(0xFFFF6B6B), fontSize = 13.sp)
                    Spacer(Modifier.height(16.dp))
                }

                Button(
                    onClick = {
                        val result = PaymentValidator.validateAll(cardNumber, expiry, cvv)
                        if (!result.isOk) {
                            errorMessage = result.errorMessage
                        } else {
                            errorMessage = null
                            viewModel.payOrder(token, orderId)
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Accent),
                    enabled = orderState !is OrderState.Loading
                ) {
                    if (orderState is OrderState.Loading) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    } else {
                        Text("Оплатити", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}
