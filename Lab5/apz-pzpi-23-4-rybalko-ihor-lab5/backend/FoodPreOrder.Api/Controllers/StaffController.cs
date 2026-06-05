using FoodPreOrder.Application.DTOs.Auth;
using FoodPreOrder.Application.DTOs.Restaurants;
using FoodPreOrder.Domain.Entities;
using FoodPreOrder.Domain.Enums;
using FoodPreOrder.Persistence.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FoodPreOrder.Api.Controllers
{
    /// <summary>
    /// Контролер для управління персоналом ресторану (HR модуль).
    /// Дозволяє власникам ресторанів наймати та звільняти працівників кухні.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class StaffController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StaffController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Перевіряє кандидата перед наймом за Email.
        /// </summary>
        /// <remarks>
        /// Виконує перевірку, чи можна найняти цю людину:
        /// - Користувач повинен існувати.
        /// - Не можна найняти Адміна або Власника іншого ресторану.
        /// - Не можна найняти людину, яка вже працює в іншому закладі.
        /// </remarks>
        /// <param name="email">Email користувача.</param>
        /// <returns>Профіль користувача, якщо він підходить.</returns>
        /// <response code="200">Користувач доступний для найму.</response>
        /// <response code="400">Користувач зайнятий або має неприпустиму роль.</response>
        /// <response code="404">Користувача з таким Email не знайдено.</response>
        [HttpGet("check-user")]
        [Authorize(Roles = "Admin,RestaurantOwner")]
        [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<UserProfileDto>> CheckUser([FromQuery] string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null) return NotFound("Користувача не знайдено.");

            if (user.Role == UserRole.Admin || user.Role == UserRole.RestaurantOwner)
                return BadRequest($"Неможливо найняти користувача з роллю {user.Role}.");

            if (user.Role == UserRole.KitchenStaff && user.RestaurantId != null)
            {
                var restaurant = await _context.Restaurants.FindAsync(user.RestaurantId);
                var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

                if (restaurant != null && restaurant.OwnerId == currentUserId)
                {
                    return BadRequest($"Цей користувач вже працює у ВАС (Ресторан: {restaurant.NameUA}).");
                }
                else
                {
                    return BadRequest("Цей користувач вже зайнятий (працює в іншому ресторані).");
                }
            }

            return Ok(new UserProfileDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Phone = user.Phone,
                Role = user.Role.ToString()
            });
        }

        /// <summary>
        /// Наймає працівника у вказаний ресторан.
        /// </summary>
        /// <remarks>
        /// Змінює роль користувача на `KitchenStaff` та прив'язує його до `RestaurantId`.
        /// Власник може наймати людей тільки у свої ресторани.
        /// </remarks>
        /// <param name="dto">Дані для найму (Email та ID ресторану).</param>
        /// <returns>Результат операції.</returns>
        /// <response code="200">Працівника успішно найнято.</response>
        /// <response code="400">Помилка валідації (користувач вже працює або має іншу роль).</response>
        /// <response code="403">Спроба найняти працівника у чужий ресторан.</response>
        /// <response code="404">Ресторан або користувача не знайдено.</response>
        [HttpPost("hire")]
        [Authorize(Roles = "Admin,RestaurantOwner")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> HireStaff([FromBody] HireStaffDto dto)
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var currentUserRole = User.FindFirstValue(ClaimTypes.Role);

            var restaurant = await _context.Restaurants.FindAsync(dto.RestaurantId);
            if (restaurant == null) return NotFound("Ресторан не знайдено.");

            if (currentUserRole == UserRole.RestaurantOwner.ToString() && restaurant.OwnerId != currentUserId)
            {
                return StatusCode(403, "Ви не можете наймати людей у чужий ресторан!");
            }

            var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (targetUser == null) return BadRequest("Користувач не знайдений.");

            if (targetUser.Role == UserRole.RestaurantOwner || targetUser.Role == UserRole.Admin)
                return BadRequest("Не можна найняти власника або адміна.");

            if (targetUser.Role == UserRole.KitchenStaff)
                return BadRequest("Цей користувач вже працевлаштований.");

            targetUser.Role = UserRole.KitchenStaff;
            targetUser.RestaurantId = dto.RestaurantId;

            var notification = new Notification
            {
                UserId = targetUser.Id,
                Message = $"Вітаємо! Вас прийнято на роботу в ресторан '{restaurant.NameUA}'.",
                DateSent = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Користувача {targetUser.FullName} успішно найнято." });
        }

        /// <summary>
        /// Звільняє працівника з ресторану.
        /// </summary>
        /// <remarks>
        /// Змінює роль користувача назад на `Customer` та видаляє прив'язку до ресторану.
        /// </remarks>
        /// <param name="dto">Дані для звільнення (Email та ID ресторану).</param>
        /// <returns>Результат операції.</returns>
        /// <response code="200">Працівника успішно звільнено.</response>
        /// <response code="400">Користувач не є працівником цього ресторану.</response>
        /// <response code="403">Спроба звільнити працівника з чужого ресторану.</response>
        /// <response code="404">Працівника не знайдено.</response>
        [HttpPost("fire")]
        [Authorize(Roles = "Admin,RestaurantOwner")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> FireStaff([FromBody] FireStaffDto dto)
        {
            var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (targetUser == null) return NotFound("Працівника з таким Email не знайдено.");

            if (targetUser.Role != UserRole.KitchenStaff || targetUser.RestaurantId == null)
            {
                return BadRequest("Цей користувач не є активним працівником кухні.");
            }

            if (targetUser.RestaurantId != dto.RestaurantId)
            {
                return BadRequest("Цей користувач працює в іншому ресторані, а не в зазначеному.");
            }

            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var currentUserRole = User.FindFirstValue(ClaimTypes.Role);

            var restaurant = await _context.Restaurants.FindAsync(dto.RestaurantId);
            if (restaurant == null) return NotFound("Ресторан не знайдено.");

            if (currentUserRole == UserRole.RestaurantOwner.ToString() && restaurant.OwnerId != currentUserId)
            {
                return StatusCode(403, "Ви не можете звільняти працівників з чужого ресторану!");
            }

            targetUser.Role = UserRole.Customer;
            targetUser.RestaurantId = null;

            var notification = new Notification
            {
                UserId = targetUser.Id,
                Message = $"Ваша робота в закладі '{restaurant.NameUA}' завершена. Вашу роль змінено на Клієнт.",
                DateSent = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Працівника {targetUser.FullName} успішно звільнено." });
        }

        /// <summary>
        /// Отримує список усіх працівників кухні для конкретного ресторану.
        /// </summary>
        /// <param name="restaurantId">ID ресторану.</param>
        /// <returns>Список профілів працівників.</returns>
        /// <response code="200">Список успішно отримано.</response>
        /// <response code="403">Спроба переглянути персонал чужого ресторану.</response>
        [HttpGet("restaurant/{restaurantId}")]
        [Authorize(Roles = "Admin,RestaurantOwner")]
        [ProducesResponseType(typeof(IEnumerable<UserProfileDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<IEnumerable<UserProfileDto>>> GetStaff(int restaurantId)
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var currentUserRole = User.FindFirstValue(ClaimTypes.Role);

            if (currentUserRole == UserRole.RestaurantOwner.ToString())
            {
                var restaurant = await _context.Restaurants.FindAsync(restaurantId);
                if (restaurant == null || restaurant.OwnerId != currentUserId)
                    return StatusCode(403, "Це не ваш ресторан.");
            }

            var staff = await _context.Users
                .Where(u => u.RestaurantId == restaurantId && u.Role == UserRole.KitchenStaff)
                .Select(u => new UserProfileDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    Phone = u.Phone,
                    Role = u.Role.ToString()
                })
                .ToListAsync();

            return Ok(staff);
        }
    }
}
