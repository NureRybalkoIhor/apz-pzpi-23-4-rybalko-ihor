using FoodPreOrder.Api.Extensions;
using FoodPreOrder.Api.Services;
using FoodPreOrder.Application.DTOs.Orders;
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
    /// Контролер для управління життєвим циклом замовлень.
    /// Відповідає за створення, перегляд історії та зміну статусів замовлень (Processing workflow).
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ICalculationService _calcService;

        public OrdersController(ApplicationDbContext context, ICalculationService calcService)
        {
            _context = context;
            _calcService = calcService;
        }

        /// <summary>
        /// Отримує список замовлень.
        /// </summary>
        /// <remarks>
        /// Логіка фільтрації залежить від ролі:
        /// - **Customer**: Бачить тільки власні замовлення.
        /// - **Admin/Staff/Owner**: Бачать замовлення всіх користувачів (можна додати фільтрацію по ресторану в майбутньому).
        /// Список відсортовано за датою створення (найновіші зверху).
        /// </remarks>
        /// <returns>Список DTO замовлень.</returns>
        /// <response code="200">Успішне отримання списку.</response>
        /// <response code="401">Користувач не авторизований.</response>
        [HttpGet]
        [Authorize]
        [ProducesResponseType(typeof(IEnumerable<OrderDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetOrders()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            var query = _context.Orders
                .Include(o => o.Items).ThenInclude(i => i.Dish)
                .Include(o => o.User)
                .AsQueryable();

            if (userRole == UserRole.Customer.ToString())
            {
                query = query.Where(o => o.UserId == userId);
            }

            var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
            return Ok(orders.Select(MapToDto));
        }

        /// <summary>
        /// Отримує деталі конкретного замовлення за ID.
        /// </summary>
        /// <remarks>
        /// Клієнт не може переглядати чужі замовлення (повернеться 403 Forbidden).
        /// </remarks>
        /// <param name="id">ID замовлення.</param>
        /// <returns>Деталі замовлення.</returns>
        /// <response code="200">Замовлення знайдено.</response>
        /// <response code="401">Користувач не авторизований.</response>
        /// <response code="403">Спроба переглянути чуже замовлення.</response>
        /// <response code="404">Замовлення не знайдено.</response>
        [HttpGet("{id}")]
        [Authorize]
        [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<OrderDto>> GetOrder(int id)
        {
            var order = await _context.Orders
               .Include(o => o.Items).ThenInclude(i => i.Dish)
               .Include(o => o.User)
               .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return NotFound();

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (userRole == UserRole.Customer.ToString() && order.UserId != userId)
            {
                return Forbid();
            }

            return Ok(MapToDto(order));
        }

        /// <summary>
        /// Створює нове замовлення.
        /// </summary>
        /// <remarks>
        /// Виконує низку перевірок:
        /// 1. Час візиту має бути мінімум через 10 хвилин від поточного часу.
        /// 2. Страви повинні існувати в базі.
        /// 
        /// Також автоматично розраховує загальну вартість (`TotalAmount`) та прогнозований час готовності (`EstimatedReadyTime`).
        /// </remarks>
        /// <param name="createDto">Дані замовлення (Час візиту, Список страв, Коментар).</param>
        /// <returns>Створене замовлення.</returns>
        /// <response code="201">Замовлення успішно створено.</response>
        /// <response code="400">Помилка валідації (некоректний час, неіснуючий ресторан або страва).</response>
        /// <response code="401">Користувач не авторизований.</response>
        [HttpPost]
        [Authorize]
        [ProducesResponseType(typeof(OrderDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<OrderDto>> CreateOrder(CreateOrderDto createDto)
        {
            if (createDto.VisitTime < DateTime.UtcNow.AddMinutes(10))
            {
                return BadRequest("Час візиту має бути мінімум через 10 хвилин.");
            }

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var restaurant = await _context.Restaurants.FindAsync(createDto.RestaurantId);
            if (restaurant == null) return BadRequest("Ресторан не знайдено");

            var order = new Order
            {
                UserId = userId,
                RestaurantId = createDto.RestaurantId,
                VisitTime = createDto.VisitTime,
                Comment = createDto.Comment,
                Status = OrderStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            decimal totalAmount = 0;
            var dishEntities = new List<Dish>();

            foreach (var itemDto in createDto.Items)
            {
                var dish = await _context.Dishes.FindAsync(itemDto.DishId);
                if (dish == null) return BadRequest($"Страву {itemDto.DishId} не знайдено");

                dishEntities.Add(dish);

                var orderItem = new OrderItem
                {
                    DishId = dish.Id,
                    Quantity = itemDto.Quantity,
                    Price = dish.Price
                };

                totalAmount += orderItem.Price * orderItem.Quantity;
                order.Items.Add(orderItem);
            }

            order.TotalAmount = totalAmount;

            order.EstimatedReadyTime = _calcService.CalculateEstimatedReadyTime(DateTime.UtcNow, dishEntities);

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            var createdOrder = await _context.Orders
                .Include(o => o.Items).ThenInclude(i => i.Dish)
                .Include(o => o.User)
                .FirstAsync(o => o.Id == order.Id);

            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, MapToDto(createdOrder));
        }

        /// <summary>
        /// Оновлює статус замовлення (Workflow).
        /// </summary>
        /// <remarks>
        /// Доступно для Admin та KitchenStaff.
        /// Зміна статусу автоматично генерує сповіщення (Notification) для клієнта.
        /// 
        /// **Логіка сповіщень:**
        /// - `Paid` -> "Оплату отримано"
        /// - `Cooking` -> "Кухня почала готувати"
        /// - `Ready` -> "Готово до видачі"
        /// - `Completed` -> "Дякуємо за замовлення"
        /// - `Cancelled` -> "Замовлення скасовано"
        /// </remarks>
        /// <param name="id">ID замовлення.</param>
        /// <param name="dto">Новий статус.</param>
        /// <returns>Результат операції та прапорець, чи було надіслано сповіщення.</returns>
        /// <response code="200">Статус успішно змінено.</response>
        /// <response code="403">Спроба керувати замовленням чужого ресторану (для Власника/Персоналу).</response>
        /// <response code="404">Замовлення не знайдено.</response>
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Admin,KitchenStaff,RestaurantOwner")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto dto)
        {
            var order = await _context.Orders
                .Include(o => o.Restaurant)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return NotFound();

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (userRole != UserRole.Admin.ToString())
            {
                if (userRole == UserRole.RestaurantOwner.ToString() && order.Restaurant.OwnerId != userId)
                    return StatusCode(403, "Ви не можете керувати замовленнями чужого ресторану!");

                if (userRole == UserRole.KitchenStaff.ToString())
                {
                    var staffUser = await _context.Users.FindAsync(userId);
                    if (staffUser == null || staffUser.RestaurantId != order.RestaurantId)
                        return StatusCode(403, "Ви не є працівником цього ресторану!");
                }
            }

            var oldStatus = order.Status;
            order.Status = dto.Status;

            string? notificationMessage = null;

            switch (dto.Status)
            {
                case OrderStatus.Pending:
                    break;

                case OrderStatus.Paid:
                    notificationMessage = $"Оплату за замовлення #{order.Id} отримано. Дякуємо!";
                    break;

                case OrderStatus.Cooking:
                    if (oldStatus == OrderStatus.Pending || oldStatus == OrderStatus.Paid)
                    {
                        notificationMessage = $"Кухня почала готувати ваше замовлення #{order.Id}. Скоро буде смачно!";
                    }
                    break;

                case OrderStatus.Ready:
                    notificationMessage = $"Ваше замовлення #{order.Id} готове до видачі! Чекаємо на вас.";
                    break;

                case OrderStatus.Completed:
                    notificationMessage = $"Дякуємо, що обрали {order.Restaurant.NameUA}! Будемо вдячні за ваш відгук у додатку.";
                    break;

                case OrderStatus.Cancelled:
                    notificationMessage = $"Ваше замовлення #{order.Id} було скасовано. Якщо це помилка, зверніться до персоналу.";
                    break;
            }

            if (!string.IsNullOrEmpty(notificationMessage))
            {
                var notification = new Notification
                {
                    UserId = order.UserId,
                    Message = notificationMessage,
                    DateSent = DateTime.UtcNow,
                    IsRead = false
                };
                _context.Notifications.Add(notification);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Статус змінено на {order.Status}", notificationSent = notificationMessage != null });
        }

        /// <summary>
        /// Симулює оплату замовлення клієнтом.
        /// </summary>
        /// <param name="id">ID замовлення.</param>
        /// <returns>Результат операції.</returns>
        [HttpPost("{id}/pay")]
        [Authorize]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> PayOrder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Restaurant)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return NotFound();

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (userRole == UserRole.Customer.ToString() && order.UserId != userId)
            {
                return StatusCode(403, "Ви не можете оплатити чуже замовлення!");
            }

            if (order.Status != OrderStatus.Pending)
            {
                return BadRequest($"Неможливо оплатити замовлення зі статусом {order.Status}");
            }

            order.Status = OrderStatus.Paid;

            var notification = new Notification
            {
                UserId = order.UserId,
                Message = $"Оплату за замовлення #{order.Id} отримано. Дякуємо!",
                DateSent = DateTime.UtcNow,
                IsRead = false
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Замовлення #{order.Id} успішно оплачено" });
        }

        private static OrderDto MapToDto(Order order)
        {
            return new OrderDto
            {
                Id = order.Id,
                CreatedAt = order.CreatedAt.ToUkraineTime(),
                VisitTime = order.VisitTime.ToUkraineTime(),
                Status = order.Status.ToString(),
                TotalAmount = order.TotalAmount,
                Comment = order.Comment,
                RestaurantId = order.RestaurantId,
                UserId = order.UserId,
                UserName = order.User?.FullName ?? "Unknown",
                Items = order.Items.Select(i => new OrderItemDto
                {
                    Id = i.Id,
                    DishId = i.DishId,
                    DishName = i.Dish?.NameUA ?? "Unknown",
                    Quantity = i.Quantity,
                    Price = i.Price
                }).ToList()
            };
        }
    }
}
