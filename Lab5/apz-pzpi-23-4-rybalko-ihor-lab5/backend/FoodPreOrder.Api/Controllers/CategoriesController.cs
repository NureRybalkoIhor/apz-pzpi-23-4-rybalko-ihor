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
    /// Контролер для управління категоріями страв (меню).
    /// Дозволяє переглядати, створювати та видаляти категорії.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CategoriesController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Отримує список категорій.
        /// </summary>
        /// <remarks>
        /// Можна отримати всі категорії системи або відфільтрувати їх за ID ресторану.
        /// </remarks>
        /// <param name="restaurantId">Необов'язковий ID ресторану для фільтрації.</param>
        /// <returns>Список категорій (DTO).</returns>
        /// <response code="200">Успішне отримання списку.</response>
        /// <response code="401">Користувач не авторизований.</response>
        [HttpGet]
        [Authorize]
        [ProducesResponseType(typeof(IEnumerable<CategoryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories([FromQuery] int? restaurantId)
        {
            var query = _context.Categories.AsQueryable();

            if (restaurantId.HasValue)
            {
                query = query.Where(c => c.RestaurantId == restaurantId.Value);
            }

            var categories = await query.ToListAsync();

            var dtos = categories.Select(c => new CategoryDto
            {
                Id = c.Id,
                NameUA = c.NameUA,
                NameEN = c.NameEN,
                RestaurantId = c.RestaurantId
            });

            return Ok(dtos);
        }

        /// <summary>
        /// Створює нову категорію в меню ресторану.
        /// </summary>
        /// <remarks>
        /// Доступно для ролей Admin, RestaurantOwner та KitchenStaff.
        /// Власник ресторану може створювати категорії лише у своєму закладі.
        /// </remarks>
        /// <param name="createDto">Дані для створення категорії (Назви та ID ресторану).</param>
        /// <returns>Створена категорія.</returns>
        /// <response code="201">Категорію успішно створено.</response>
        /// <response code="400">Ресторан не знайдено або некоректні дані.</response>
        /// <response code="401">Користувач не авторизований.</response>
        /// <response code="403">Спроба створити категорію в чужому ресторані.</response>
        [HttpPost]
        [Authorize(Roles = "Admin,RestaurantOwner,KitchenStaff")]
        [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<CategoryDto>> CreateCategory(CreateCategoryDto createDto)
        {
            var restaurant = await _context.Restaurants.FindAsync(createDto.RestaurantId);

            if (restaurant == null)
            {
                return BadRequest($"Ресторан з ID {createDto.RestaurantId} не знайдено.");
            }

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (userRole == UserRole.RestaurantOwner.ToString())
            {
                if (restaurant.OwnerId != userId)
                {
                    return StatusCode(403, "Ви не можете створювати категорії в чужому ресторані!");
                }
            }

            var category = new Category
            {
                NameUA = createDto.NameUA,
                NameEN = createDto.NameEN,
                RestaurantId = createDto.RestaurantId
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            var responseDto = new CategoryDto
            {
                Id = category.Id,
                NameUA = category.NameUA,
                NameEN = category.NameEN,
                RestaurantId = category.RestaurantId
            };

            return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, responseDto);
        }

        /// <summary>
        /// Видаляє існуючу категорію.
        /// </summary>
        /// <remarks>
        /// Доступно для ролей Admin, RestaurantOwner та KitchenStaff.
        /// Власник ресторану може видаляти категорії лише свого ресторану.
        /// </remarks>
        /// <param name="id">ID категорії, яку треба видалити.</param>
        /// <returns>Статус 204 No Content у разі успіху.</returns>
        /// <response code="204">Успішне видалення.</response>
        /// <response code="401">Користувач не авторизований.</response>
        /// <response code="403">Спроба видалити категорію чужого ресторану.</response>
        /// <response code="404">Категорію не знайдено.</response>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,RestaurantOwner,KitchenStaff")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories
                .Include(c => c.Restaurant)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                return NotFound();
            }

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (userRole == UserRole.RestaurantOwner.ToString())
            {
                if (category.Restaurant.OwnerId != userId)
                {
                    return StatusCode(403, "Ви не можете видаляти категорії чужого ресторану!");
                }
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
