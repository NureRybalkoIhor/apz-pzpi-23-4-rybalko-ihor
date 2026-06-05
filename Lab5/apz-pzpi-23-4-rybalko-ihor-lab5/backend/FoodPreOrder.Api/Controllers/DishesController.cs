using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using FoodPreOrder.Domain.Entities;
using FoodPreOrder.Persistence.Data;
using FoodPreOrder.Application.DTOs.Restaurants;
using FoodPreOrder.Api.Services;
using Microsoft.AspNetCore.Authorization;
using FoodPreOrder.Domain.Enums;
using System.Security.Claims;

namespace FoodPreOrder.Api.Controllers
{
    /// <summary>
    /// Контролер для управління стравами (позиціями меню).
    /// Забезпечує додавання, перегляд та видалення страв, включаючи завантаження зображень.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class DishesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileStorageService _fileService;

        public DishesController(ApplicationDbContext context, IFileStorageService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        /// <summary>
        /// Отримує список страв.
        /// </summary>
        /// <remarks>
        /// Дозволяє отримати всі страви або відфільтрувати їх за категорією.
        /// </remarks>
        /// <param name="categoryId">Необов'язковий ID категорії для фільтрації страв конкретного розділу меню.</param>
        /// <returns>Список страв (DTO).</returns>
        /// <response code="200">Успішне отримання списку.</response>
        /// <response code="401">Користувач не авторизований.</response>
        [HttpGet]
        // [Authorize]
        [ProducesResponseType(typeof(IEnumerable<DishDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<IEnumerable<DishDto>>> GetDishes([FromQuery] int? categoryId)
        {
            var query = _context.Dishes
                .Include(d => d.Category)
                .AsQueryable();

            if (categoryId.HasValue)
            {
                query = query.Where(d => d.CategoryId == categoryId.Value);
            }

            var dishes = await query.ToListAsync();

            var dtos = dishes.Select(d => new DishDto
            {
                Id = d.Id,
                NameUA = d.NameUA,
                NameEN = d.NameEN,
                DescriptionUA = d.DescriptionUA,
                DescriptionEN = d.DescriptionEN,
                Price = d.Price,
                ImageUrl = d.ImageUrl,
                PreparationTimeMinutes = d.PreparationTimeMinutes,
                IsAvailable = d.IsAvailable,
                CategoryId = d.CategoryId,
                CategoryNameUA = d.Category?.NameUA ?? "Невідома категорія"
            });

            return Ok(dtos);
        }

        /// <summary>
        /// Отримує детальну інформацію про конкретну страву за її ID.
        /// </summary>
        /// <param name="id">Унікальний ідентифікатор страви.</param>
        /// <returns>DTO страви.</returns>
        /// <response code="200">Страву знайдено.</response>
        /// <response code="401">Користувач не авторизований.</response>
        /// <response code="404">Страву не знайдено.</response>
        [HttpGet("{id}")]
        [Authorize]
        [ProducesResponseType(typeof(DishDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<DishDto>> GetDish(int id)
        {
            var d = await _context.Dishes
                .Include(x => x.Category)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (d == null)
            {
                return NotFound("Страву не знайдено");
            }

            var dto = new DishDto
            {
                Id = d.Id,
                NameUA = d.NameUA,
                NameEN = d.NameEN,
                DescriptionUA = d.DescriptionUA,
                DescriptionEN = d.DescriptionEN,
                Price = d.Price,
                ImageUrl = d.ImageUrl,
                PreparationTimeMinutes = d.PreparationTimeMinutes,
                IsAvailable = d.IsAvailable,
                CategoryId = d.CategoryId,
                CategoryNameUA = d.Category?.NameUA ?? "Невідома категорія"
            };

            return Ok(dto);
        }

        /// <summary>
        /// Створює нову страву.
        /// </summary>
        /// <remarks>
        /// Приймає дані у форматі `multipart/form-data`, що дозволяє завантажувати зображення.
        /// Власник ресторану може додавати страви лише у свої категорії.
        /// </remarks>
        /// <param name="createDto">Дані для створення страви (Назва, Ціна, Опис, Зображення).</param>
        /// <returns>Створена страва.</returns>
        /// <response code="201">Страву успішно створено.</response>
        /// <response code="400">Категорії не існує або дані некоректні.</response>
        /// <response code="401">Користувач не авторизований.</response>
        /// <response code="403">Спроба додати страву в чужий ресторан.</response>
        [HttpPost]
        [Authorize(Roles = "Admin,RestaurantOwner,KitchenStaff")]
        [ProducesResponseType(typeof(DishDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<DishDto>> CreateDish([FromForm] CreateDishDto createDto)
        {
            var category = await _context.Categories
                .Include(c => c.Restaurant)
                .FirstOrDefaultAsync(c => c.Id == createDto.CategoryId);

            if (category == null) return BadRequest("Категорії не існує.");

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var userRoleStr = User.FindFirstValue(ClaimTypes.Role);

            if (userRoleStr == UserRole.RestaurantOwner.ToString())
            {
                if (category.Restaurant.OwnerId != userId)
                {
                    return StatusCode(403, "Ви не можете додавати страви в чужий ресторан!");
                }
            }

            string? imagePath = null;
            if (createDto.Image != null)
            {
                imagePath = await _fileService.SaveFileAsync(createDto.Image, "dishes");
            }

            var dish = new Dish
            {
                NameUA = createDto.NameUA,
                NameEN = createDto.NameEN,
                DescriptionUA = createDto.DescriptionUA,
                DescriptionEN = createDto.DescriptionEN,
                Price = createDto.Price,
                ImageUrl = imagePath,
                PreparationTimeMinutes = createDto.PreparationTimeMinutes,
                CategoryId = createDto.CategoryId,
                IsAvailable = true
            };

            _context.Dishes.Add(dish);
            await _context.SaveChangesAsync();

            var responseDto = new DishDto
            {
                Id = dish.Id,
                NameUA = dish.NameUA,
                NameEN = dish.NameEN,
                DescriptionUA = dish.DescriptionUA,
                DescriptionEN = dish.DescriptionEN,
                Price = dish.Price,
                ImageUrl = dish.ImageUrl,
                PreparationTimeMinutes = dish.PreparationTimeMinutes,
                IsAvailable = dish.IsAvailable,
                CategoryId = dish.CategoryId,
                CategoryNameUA = category.NameUA
            };

            return CreatedAtAction(nameof(GetDish), new { id = dish.Id }, responseDto);
        }

        /// <summary>
        /// Видаляє страву з меню.
        /// </summary>
        /// <remarks>
        /// Власник ресторану може видаляти лише страви свого закладу.
        /// </remarks>
        /// <param name="id">ID страви.</param>
        /// <returns>Статус 204 No Content.</returns>
        /// <response code="204">Страву успішно видалено.</response>
        /// <response code="401">Користувач не авторизований.</response>
        /// <response code="403">Спроба видалити страву з чужого ресторану.</response>
        /// <response code="404">Страву не знайдено.</response>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,KitchenStaff,RestaurantOwner")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteDish(int id)
        {
            var dish = await _context.Dishes
                .Include(d => d.Category)
                .ThenInclude(c => c.Restaurant)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (dish == null)
            {
                return NotFound();
            }

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (userRole == UserRole.RestaurantOwner.ToString())
            {
                if (dish.Category?.Restaurant?.OwnerId != userId)
                {
                    return StatusCode(403, "Ви не можете видаляти страви з чужого ресторану!");
                }
            }

            _context.Dishes.Remove(dish);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}

