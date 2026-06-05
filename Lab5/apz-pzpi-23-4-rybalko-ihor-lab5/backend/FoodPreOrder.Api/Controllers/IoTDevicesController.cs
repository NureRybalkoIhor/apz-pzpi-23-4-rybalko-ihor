using FoodPreOrder.Api.Services;
using FoodPreOrder.Application.DTOs.IoT;
using FoodPreOrder.Domain.Enums;
using FoodPreOrder.Persistence.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace FoodPreOrder.Api.Controllers
{
    /// <summary>
    /// Контролер для управління фізичними IoT-пристроями ресторану.
    /// Забезпечує реєстрацію обладнання та моніторинг його стану через механізм "Ping".
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class IoTDevicesController : ControllerBase
    {
        private readonly IoTService _iotService;
        private readonly ApplicationDbContext _context;

        public IoTDevicesController(IoTService iotService, ApplicationDbContext context)
        {
            _iotService = iotService;
            _context = context;
        }

        /// <summary>
        /// Реєструє новий IoT-пристрій у системі.
        /// </summary>
        /// <remarks>
        /// Доступно для Admin та RestaurantOwner. 
        /// Власник може додавати пристрої лише до своїх ресторанів.
        /// Пристрій отримує статус "New" і стає активним після першого пінгу.
        /// </remarks>
        /// <param name="dto">Дані для реєстрації (Серійний номер, Назва локації, ID ресторану).</param>
        /// <returns>Створений об'єкт пристрою.</returns>
        /// <response code="200">Пристрій успішно зареєстровано.</response>
        /// <response code="400">Помилка валідації або пристрій з таким серійним номером вже існує.</response>
        /// <response code="401">Користувач не авторизований.</response>
        /// <response code="403">Спроба додати пристрій у чужий ресторан.</response>
        [HttpPost]
        [Authorize(Roles = "Admin,RestaurantOwner")]
        [ProducesResponseType(typeof(IoTDeviceDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IoTDeviceDto>> CreateDevice([FromBody] CreateIoTDeviceDto dto)
        {
            if (!await CheckAccess(dto.RestaurantId))
                return StatusCode(403, "Ви не можете додавати обладнання в чужий ресторан!");

            try
            {
                var device = await _iotService.RegisterDeviceAsync(dto);

                return Ok(new IoTDeviceDto
                {
                    Id = device.Id,
                    SerialNumber = device.SerialNumber,
                    LocationName = device.LocationName,
                    IsActive = device.IsActive,
                    LastPing = device.LastPing,
                    Status = "New"
                });
            }
            catch (System.Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Отримує список усіх пристроїв конкретного ресторану.
        /// </summary>
        /// <remarks>
        /// Використовується для моніторингу: дозволяє побачити, які пристрої онлайн (відправляли пінг нещодавно).
        /// </remarks>
        /// <param name="restaurantId">ID ресторану.</param>
        /// <returns>Список пристроїв.</returns>
        /// <response code="200">Список успішно отримано.</response>
        /// <response code="401">Користувач не авторизований.</response>
        /// <response code="403">Спроба переглянути пристрої чужого ресторану.</response>
        [HttpGet("restaurant/{restaurantId}")]
        [Authorize(Roles = "Admin,RestaurantOwner")]
        [ProducesResponseType(typeof(IEnumerable<IoTDeviceDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IEnumerable<IoTDeviceDto>>> GetDevices(int restaurantId)
        {
            if (!await CheckAccess(restaurantId))
                return StatusCode(403, "Це не ваш ресторан.");

            var devices = await _iotService.GetRestaurantDevicesAsync(restaurantId);
            return Ok(devices);
        }

        /// <summary>
        /// Приймає сигнал "Heartbeat" (Ping) від фізичного пристрою.
        /// </summary>
        /// <remarks>
        /// Цей метод викликається апаратним забезпеченням (мікроконтролером або скриптом на терміналі) кожні N секунд.
        /// Не вимагає авторизації користувача (JWT), ідентифікація відбувається за серійним номером.
        /// Оновлює поле LastPing у базі даних.
        /// </remarks>
        /// <param name="serialNumber">Унікальний серійний номер пристрою (рядок).</param>
        /// <returns>Поточний час сервера (Pong).</returns>
        /// <response code="200">Ping успішний, пристрій розпізнано.</response>
        /// <response code="404">Пристрій з таким серійним номером не зареєстровано в системі.</response>
        [HttpPost("ping")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Ping([FromBody] string serialNumber)
        {
            var result = await _iotService.PingDeviceAsync(serialNumber);

            if (!result) return NotFound("Unknown device");

            return Ok(new { message = "Pong", serverTime = System.DateTime.UtcNow });
        }

        /// <summary>
        /// Видаляє пристрій із системи.
        /// </summary>
        /// <remarks>
        /// Доступно Admin та RestaurantOwner (тільки для своїх пристроїв).
        /// </remarks>
        /// <param name="id">ID пристрою.</param>
        /// <returns>Повідомлення про успішне видалення.</returns>
        /// <response code="200">Пристрій видалено.</response>
        /// <response code="401">Користувач не авторизований.</response>
        /// <response code="403">Спроба видалити пристрій чужого ресторану.</response>
        /// <response code="404">Пристрій не знайдено.</response>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,RestaurantOwner")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteDevice(int id)
        {
            var device = await _iotService.GetDeviceByIdAsync(id);
            if (device == null) return NotFound("Пристрій не знайдено.");

            if (!await CheckAccess(device.RestaurantId))
                return StatusCode(403, "Ви не можете видаляти пристрої з чужого ресторану.");

            await _iotService.DeleteDeviceAsync(id);

            return Ok(new { message = "Пристрій видалено." });
        }

        private async Task<bool> CheckAccess(int restaurantId)
        {
            var userRole = User.FindFirstValue(ClaimTypes.Role);
            if (userRole == UserRole.Admin.ToString()) return true;

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var restaurant = await _context.Restaurants.FindAsync(restaurantId);

            return restaurant != null && restaurant.OwnerId == userId;
        }
    }
}
