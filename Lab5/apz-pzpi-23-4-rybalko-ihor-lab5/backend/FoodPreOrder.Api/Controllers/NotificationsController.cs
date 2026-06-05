using FoodPreOrder.Persistence.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FoodPreOrder.Application.DTOs.Notifications;

namespace FoodPreOrder.Api.Controllers
{
    /// <summary>
    /// Контролер для управління особистими сповіщеннями користувача.
    /// Дозволяє переглядати історію повідомлень та змінювати їх статус.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Отримує список усіх сповіщень поточного користувача.
        /// </summary>
        /// <remarks>
        /// Повертає сповіщення відсортовані за датою (спочатку нові).
        /// Ідентифікатор користувача береться автоматично з токена авторизації.
        /// </remarks>
        /// <returns>Список сповіщень (DTO).</returns>
        /// <response code="200">Успішне отримання списку.</response>
        /// <response code="401">Користувач не авторизований.</response>
        [HttpGet]
        [Authorize]
        [ProducesResponseType(typeof(IEnumerable<NotificationDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetMyNotifications()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.DateSent)
                .ToListAsync();

            var dtos = notifications.Select(n => new NotificationDto
            {
                Id = n.Id,
                Message = n.Message,
                DateSent = n.DateSent,
                IsRead = n.IsRead
            });

            return Ok(dtos);
        }

        /// <summary>
        /// Позначає конкретне сповіщення як прочитане.
        /// </summary>
        /// <remarks>
        /// Користувач може позначити тільки власні сповіщення.
        /// Якщо сповіщення належить іншому користувачеві, повернеться помилка 404.
        /// </remarks>
        /// <param name="id">ID сповіщення.</param>
        /// <returns>Статус 200 OK.</returns>
        /// <response code="200">Сповіщення успішно оновлено.</response>
        /// <response code="401">Користувач не авторизований.</response>
        /// <response code="404">Сповіщення не знайдено або воно належить іншому користувачеві.</response>
        [HttpPost("read/{id}")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null) return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}
