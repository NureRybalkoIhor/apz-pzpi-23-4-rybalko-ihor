using FoodPreOrder.Api.Services;
using FoodPreOrder.Application.DTOs;
using FoodPreOrder.Application.DTOs.Restaurants;
using FoodPreOrder.Domain.Entities;
using FoodPreOrder.Domain.Enums;
using FoodPreOrder.Persistence.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FoodPreOrder.Api.Controllers
{
    /// <summary>
    /// Контролер для управління закладами харчування (ресторанами).
    /// Дозволяє шукати заклади (в тому числі за геолокацією), створювати нові та видаляти існуючі.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class RestaurantsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ICalculationService _calcService;

        public RestaurantsController(ApplicationDbContext context, ICalculationService calcService)
        {
            _context = context;
            _calcService = calcService;
        }

        /// <summary>
        /// Отримує список ресторанів.
        /// </summary>
        /// <remarks>
        /// Підтримує сортування за відстанню до користувача.
        /// - Якщо передати `userLat` та `userLon`, список буде відсортовано від найближчого до найдальшого.
        /// - Якщо координати не передано, повертається звичайний список.
        /// </remarks>
        /// <param name="userLat">Широта користувача (Latitude).</param>
        /// <param name="userLon">Довгота користувача (Longitude).</param>
        /// <returns>Список ресторанів (DTO).</returns>
        /// <response code="200">Успішне отримання списку.</response>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<RestaurantDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<object>>> GetRestaurants([FromQuery] double? userLat, [FromQuery] double? userLon)
        {
            var restaurants = await _context.Restaurants
                                            .Include(r => r.Owner)
                                            .ToListAsync();

            if (!userLat.HasValue || !userLon.HasValue)
            {
                var dtos = restaurants.Select(r => new RestaurantDto
                {
                    Id = r.Id,
                    NameUA = r.NameUA,
                    NameEN = r.NameEN,
                    Address = r.Address,
                    ImageUrl = r.ImageUrl,
                    Latitude = r.Latitude,
                    Longitude = r.Longitude,
                    IsActive = r.IsActive,
                    PaidUntil = r.PaidUntil,
                    OwnerId = r.OwnerId,
                    Owner = r.Owner == null ? null : new OwnerDto
                    {
                        Id = r.Owner.Id,
                        FullName = r.Owner.FullName,
                        Email = r.Owner.Email
                    }
                });

                return Ok(dtos);
            }

            var sortedRestaurants = restaurants
                .Select(r => new
                {
                    Restaurant = r,
                    DistanceKm = _calcService.CalculateDistance(userLat.Value, userLon.Value, r.Latitude, r.Longitude)
                })
                .OrderBy(x => x.DistanceKm)
                .Select(x => new RestaurantDto
                {
                    Id = x.Restaurant.Id,
                    NameUA = x.Restaurant.NameUA,
                    NameEN = x.Restaurant.NameEN,
                    Address = x.Restaurant.Address,
                    ImageUrl = x.Restaurant.ImageUrl,
                    Latitude = x.Restaurant.Latitude,
                    Longitude = x.Restaurant.Longitude,
                    IsActive = x.Restaurant.IsActive,
                    PaidUntil = x.Restaurant.PaidUntil,
                    OwnerId = x.Restaurant.OwnerId,
                    Owner = x.Restaurant.Owner == null ? null : new OwnerDto
                    {
                        Id = x.Restaurant.Owner.Id,
                        FullName = x.Restaurant.Owner.FullName,
                        Email = x.Restaurant.Owner.Email
                    }
                });

            return Ok(sortedRestaurants);
        }

        /// <summary>
        /// Отримує детальну інформацію про ресторан за його ID.
        /// </summary>
        /// <param name="id">ID ресторану.</param>
        /// <returns>DTO ресторану.</returns>
        /// <response code="200">Ресторан знайдено.</response>
        /// <response code="404">Заклад не знайдено.</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(RestaurantDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<RestaurantDto>> GetRestaurant(int id)
        {
            var r = await _context.Restaurants
                .Include(rest => rest.Owner)
                .FirstOrDefaultAsync(rest => rest.Id == id);

            if (r == null)
            {
                return NotFound("Заклад не знайдено");
            }

            var restaurantDto = new RestaurantDto
            {
                Id = r.Id,
                NameUA = r.NameUA,
                NameEN = r.NameEN,
                Address = r.Address,
                ImageUrl = r.ImageUrl,
                Latitude = r.Latitude,
                Longitude = r.Longitude,
                IsActive = r.IsActive,
                OwnerId = r.OwnerId,
                Owner = r.Owner == null ? null : new OwnerDto
                {
                    Id = r.Owner.Id,
                    FullName = r.Owner.FullName,
                    Email = r.Owner.Email
                }
            };

            return Ok(restaurantDto);
        }

        /// <summary>
        /// Реєструє новий ресторан у системі.
        /// </summary>
        /// <remarks>
        /// Доступно для Admin та RestaurantOwner.
        /// - Якщо створює **RestaurantOwner**: він автоматично прив'язується як власник.
        /// - Якщо створює **Admin**: він може вказати ID будь-якого користувача як власника (через `createDto.OwnerId`).
        /// </remarks>
        /// <param name="createDto">Дані для створення (Назва, Адреса, Координати).</param>
        /// <returns>Створений ресторан.</returns>
        /// <response code="201">Ресторан успішно створено.</response>
        /// <response code="400">Вказаного власника не існує (для Адміна).</response>
        /// <response code="401">Користувач не авторизований.</response>
        [HttpPost]
        [Authorize(Roles = "Admin,RestaurantOwner")]
        [ProducesResponseType(typeof(RestaurantDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<RestaurantDto>> CreateRestaurant(CreateRestaurantDto createDto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var userRoleStr = User.FindFirstValue(ClaimTypes.Role);

            int realOwnerId;

            if (userRoleStr == UserRole.RestaurantOwner.ToString())
            {
                realOwnerId = userId;
            }
            else
            {
                realOwnerId = createDto.OwnerId;
            }

            var owner = await _context.Users.FindAsync(realOwnerId);
            if (owner == null) return BadRequest($"Користувача з ID {realOwnerId} не існує.");

            var restaurant = new Restaurant
            {
                NameUA = createDto.NameUA,
                NameEN = createDto.NameEN,
                Address = createDto.Address,
                ImageUrl = createDto.ImageUrl,
                Latitude = createDto.Latitude,
                Longitude = createDto.Longitude,
                OwnerId = realOwnerId,
                IsActive = true
            };

            _context.Restaurants.Add(restaurant);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRestaurant), new { id = restaurant.Id }, new RestaurantDto { Id = restaurant.Id, NameUA = restaurant.NameUA });
        }

        /// <summary>
        /// Видаляє ресторан із системи.
        /// </summary>
        /// <remarks>
        /// - **Admin**: Може видалити будь-який ресторан.
        /// - **RestaurantOwner**: Може видалити тільки власний ресторан.
        /// </remarks>
        /// <param name="id">ID ресторану.</param>
        /// <returns>Результат операції.</returns>
        /// <response code="200">Ресторан видалено.</response>
        /// <response code="401">Користувач не авторизований.</response>
        /// <response code="403">Спроба видалити чужий ресторан.</response>
        /// <response code="404">Ресторан не знайдено.</response>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,RestaurantOwner")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteRestaurant(int id)
        {
            var restaurant = await _context.Restaurants.FindAsync(id);
            if (restaurant == null) return NotFound("Заклад не знайдено");

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var userRoleStr = User.FindFirstValue(ClaimTypes.Role);

            if (userRoleStr == UserRole.RestaurantOwner.ToString())
            {
                if (restaurant.OwnerId != userId)
                {
                    return StatusCode(403, "Ви не маєте права видаляти чужий ресторан!");
                }
            }

            _context.Restaurants.Remove(restaurant);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Ресторан успішно видалено." });
        }
    }
}
