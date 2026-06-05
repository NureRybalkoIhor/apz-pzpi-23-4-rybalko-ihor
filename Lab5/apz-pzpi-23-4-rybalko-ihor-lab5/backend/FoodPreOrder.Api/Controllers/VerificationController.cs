using FoodPreOrder.Application.DTOs.Admin;
using FoodPreOrder.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FoodPreOrder.Api.Controllers
{
    /// <summary>
    /// Контролер для верифікації бізнес-користувачів.
    /// Дозволяє користувачам подавати документи для отримання статусу "RestaurantOwner",
    /// а адміністраторам — переглядати та затверджувати ці заявки.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class VerificationController : ControllerBase
    {
        private readonly IVerificationService _verificationService;

        public VerificationController(IVerificationService verificationService)
        {
            _verificationService = verificationService;
        }

        /// <summary>
        /// Подає заявку на верифікацію облікового запису.
        /// </summary>
        /// <remarks>
        /// Приймає файл (скан документів) у форматі `multipart/form-data`.
        /// Якщо заявка схвалена, користувач отримає роль `RestaurantOwner`.
        /// </remarks>
        /// <param name="dto">Дані заявки (Файл документу).</param>
        /// <returns>Результат подачі заявки.</returns>
        /// <response code="200">Документи успішно завантажено.</response>
        /// <response code="400">Файл не обрано або він порожній.</response>
        /// <response code="401">Користувач не авторизований.</response>
        /// <response code="500">Внутрішня помилка сервера при збереженні файлу.</response>
        [HttpPost("submit")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Submit([FromForm] SubmitVerificationDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                if (dto.Document == null || dto.Document.Length == 0)
                {
                    return BadRequest("Будь ласка, завантажте файл.");
                }

                await _verificationService.SubmitRequestAsync(userId, dto.Document);

                return Ok(new { message = "Документи успішно відправлено на перевірку." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Помилка сервера: " + ex.Message });
            }
        }

        /// <summary>
        /// Отримує список заявок, що очікують на розгляд.
        /// </summary>
        /// <remarks>
        /// Доступно тільки для Адміністраторів.
        /// </remarks>
        /// <returns>Список заявок зі статусом Pending.</returns>
        /// <response code="200">Успішне отримання списку.</response>
        /// <response code="403">Доступ заборонено (тільки Admin).</response>
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetPending()
        {
            var requests = await _verificationService.GetPendingRequestsAsync();
            return Ok(requests);
        }

        /// <summary>
        /// Обробляє заявку на верифікацію (Схвалення або відхилення).
        /// </summary>
        /// <remarks>
        /// Адміністратор вирішує долю заявки.
        /// - У разі схвалення (`IsApproved = true`), користувач отримує роль RestaurantOwner.
        /// - У разі відхилення, заявка позначається як Rejected, можна вказати причину.
        /// </remarks>
        /// <param name="dto">Рішення адміністратора (ID заявки, статус, причина відмови).</param>
        /// <returns>Результат обробки.</returns>
        /// <response code="200">Заявку успішно оброблено.</response>
        /// <response code="400">Заявку не знайдено або вона вже оброблена.</response>
        /// <response code="403">Доступ заборонено.</response>
        [HttpPost("process")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> Process([FromBody] ProcessVerificationDto dto)
        {
            var adminId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

            var result = await _verificationService.ProcessRequestAsync(adminId, dto);

            if (!result)
                return BadRequest("Заявка не знайдена або вже була оброблена.");

            return Ok(new { message = dto.IsApproved ? "Власника затверджено успішно!" : "Заявку відхилено." });
        }
    }
}
