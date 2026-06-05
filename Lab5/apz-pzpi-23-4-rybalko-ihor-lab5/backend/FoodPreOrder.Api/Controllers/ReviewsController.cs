using FoodPreOrder.Application.DTOs.Reviews;
using FoodPreOrder.Domain.Entities;
using FoodPreOrder.Persistence.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using FoodPreOrder.Api.Extensions;

namespace FoodPreOrder.Api.Controllers
{
    /// <summary>
    /// Контролер для управління відгуками та рейтингами страв.
    /// Дозволяє користувачам переглядати думки інших та залишати власні коментарі.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReviewsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Отримує список відгуків для конкретної страви.
        /// </summary>
        /// <remarks>
        /// Відгуки відсортовані за датою: від найновіших до найстаріших.
        /// Цей метод публічний і не вимагає авторизації.
        /// </remarks>
        /// <param name="dishId">ID страви, для якої потрібно отримати відгуки.</param>
        /// <returns>Список DTO відгуків.</returns>
        /// <response code="200">Успішне отримання списку.</response>
        [HttpGet("dish/{dishId}")]
        [ProducesResponseType(typeof(IEnumerable<ReviewDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<ReviewDto>>> GetDishReviews(int dishId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Where(r => r.DishId == dishId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var dtos = reviews.Select(r => new ReviewDto
            {
                Id = r.Id,
                Rating = r.Rating,
                Comment = r.Comment,
                UserName = r.User?.FullName ?? "Анонім",
                CreatedAt = r.CreatedAt.ToUkraineTime()
            });

            return Ok(dtos);
        }

        /// <summary>
        /// Додає новий відгук до страви.
        /// </summary>
        /// <remarks>
        /// Вимагає авторизації (JWT Token).
        /// Користувач передає оцінку (Rating) та текстовий коментар.
        /// </remarks>
        /// <param name="createDto">Дані для створення відгуку (ID страви, оцінка, коментар).</param>
        /// <returns>Створений відгук.</returns>
        /// <response code="200">Відгук успішно додано.</response>
        /// <response code="400">Страву не знайдено.</response>
        /// <response code="401">Користувач не авторизований.</response>
        [HttpPost]
        [Authorize]
        [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ReviewDto>> CreateReview(CreateReviewDto createDto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdStr == null) return Unauthorized();
            int userId = int.Parse(userIdStr);

            var dish = await _context.Dishes.FindAsync(createDto.DishId);
            if (dish == null) return BadRequest("Страву не знайдено");

            var review = new Review
            {
                DishId = createDto.DishId,
                UserId = userId,
                Rating = createDto.Rating,
                Comment = createDto.Comment,
                CreatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(userId);

            return Ok(new ReviewDto
            {
                Id = review.Id,
                Rating = review.Rating,
                Comment = review.Comment,
                UserName = user?.FullName ?? "Я",
                CreatedAt = review.CreatedAt
            });
        }
    }
}
