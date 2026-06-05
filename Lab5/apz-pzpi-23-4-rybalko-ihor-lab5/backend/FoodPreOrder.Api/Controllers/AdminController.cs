using FoodPreOrder.Application.DTOs.Admin;
using FoodPreOrder.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FoodPreOrder.Api.Controllers
{
    /// <summary>
    /// Контролер для виконання адміністративних функцій.
    /// Доступ дозволено лише користувачам з роллю "Admin".
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        /// <summary>
        /// Отримує список усіх зареєстрованих користувачів у системі.
        /// </summary>
        /// <returns>Список DTO користувачів.</returns>
        /// <response code="200">Успішне отримання списку.</response>
        /// <response code="401">Користувач не авторизований.</response>
        /// <response code="403">Недостатньо прав (потрібна роль Admin).</response>
        [HttpGet("users")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _adminService.GetAllUsersAsync();
            return Ok(users);
        }

        /// <summary>
        /// Блокує доступ користувача до системи.
        /// </summary>
        /// <param name="dto">Об'єкт даних для блокування (ID користувача та причина).</param>
        /// <returns>Повідомлення про успішне блокування.</returns>
        /// <response code="200">Користувача успішно заблоковано.</response>
        /// <response code="404">Користувача не знайдено.</response>
        [HttpPost("block")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> BlockUser([FromBody] BlockUserDto dto)
        {
            try
            {
                var adminId = GetCurrentUserId();

                var result = await _adminService.BlockUserAsync(adminId, dto);

                if (!result)
                    return NotFound("Користувача не знайдено.");

                return Ok(new { message = "Користувача успішно заблоковано." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Відновлює доступ заблокованого користувача до системи.
        /// </summary>
        /// <param name="userId">Унікальний ідентифікатор користувача.</param>
        /// <returns>Повідомлення про розблокування.</returns>
        /// <response code="200">Користувача успішно розблоковано.</response>
        /// <response code="404">Користувача не знайдено.</response>
        [HttpPost("unblock/{userId}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UnblockUser(int userId)
        {
            var adminId = GetCurrentUserId();
            var result = await _adminService.UnblockUserAsync(adminId, userId);

            if (!result)
                return NotFound("Користувача не знайдено.");

            return Ok(new { message = "Користувача розблоковано." });
        }

        /// <summary>
        /// Отримує журнал активності адміністраторів та системних подій (Audit Logs).
        /// </summary>
        /// <returns>Список останніх логів.</returns>
        [HttpGet("logs")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetActivityLogs()
        {
            var logs = await _adminService.GetRecentLogsAsync();
            return Ok(logs);
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null ? int.Parse(claim.Value) : 0;
        }

        /// <summary>
        /// Змінює роль користувача в системі (наприклад, з Customer на Manager).
        /// </summary>
        /// <param name="dto">Дані для зміни ролі (ID користувача та нова роль).</param>
        /// <returns>Результат операції.</returns>
        /// <response code="200">Роль успішно змінено.</response>
        /// <response code="404">Користувача не знайдено.</response>
        [HttpPut("users/role")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ChangeRole([FromBody] ChangeRoleDto dto)
        {
            var adminId = GetCurrentUserId();
            var result = await _adminService.ChangeUserRoleAsync(adminId, dto);

            if (!result) return NotFound("Користувача не знайдено");

            return Ok(new { message = "Роль користувача успішно змінено." });
        }

        /// <summary>
        /// Змінює статус активності ресторану (блокування або активація).
        /// </summary>
        /// <param name="id">ID ресторану.</param>
        /// <param name="isActive">Новий статус (true - активний, false - заблокований).</param>
        /// <returns>Повідомлення про зміну статусу.</returns>
        /// <response code="200">Статус успішно оновлено.</response>
        /// <response code="404">Ресторан не знайдено.</response>
        [HttpPatch("restaurants/{id}/status")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ToggleRestaurantStatus(int id, [FromQuery] bool isActive)
        {
            var adminId = GetCurrentUserId();
            var result = await _adminService.ToggleRestaurantStatusAsync(adminId, id, isActive);

            if (!result) return NotFound("Ресторан не знайдено");

            return Ok(new { message = $"Статус ресторану змінено на {(isActive ? "Активний" : "Заблокований")}" });
        }

    }
}
