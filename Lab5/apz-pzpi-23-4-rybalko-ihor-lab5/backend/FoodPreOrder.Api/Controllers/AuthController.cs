using FoodPreOrder.Domain.Entities;
using FoodPreOrder.Domain.Enums;
using FoodPreOrder.Persistence.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text;
using FoodPreOrder.Application.DTOs.Auth;
using Microsoft.AspNetCore.Authorization;
using FoodPreOrder.Infrastructure.Security;

namespace FoodPreOrder.Api.Controllers
{
    /// <summary>
    /// Контролер для керування аутентифікацією та обліковими записами користувачів.
    /// Відповідає за реєстрацію, вхід, відновлення паролю та отримання профілю.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtTokenGenerator _jwtGenerator;

        public AuthController(ApplicationDbContext context, IConfiguration configuration, IJwtTokenGenerator jwtGenerator)
        {
            _context = context;
            _jwtGenerator = jwtGenerator;
        }

        /// <summary>
        /// Реєстрація нового користувача в системі.
        /// </summary>
        /// <remarks>
        /// Створює нового користувача з роллю "Customer" за замовчуванням.
        /// Пароль зберігається у хешованому вигляді.
        /// </remarks>
        /// <param name="request">DTO з даними для реєстрації (Ім'я, Email, Телефон, Пароль).</param>
        /// <returns>Повідомлення про успішну реєстрацію.</returns>
        /// <response code="200">Реєстрація пройшла успішно.</response>
        /// <response code="400">Користувач з таким Email вже існує.</response>
        [HttpPost("register")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<User>> Register(RegisterUserDto request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("Користувач з таким email вже існує.");
            }

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                PasswordHash = passwordHash,
                Role = UserRole.Customer,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok("Реєстрація успішна! Тепер ви можете увійти.");
        }

        /// <summary>
        /// Вхід у систему (Login).
        /// </summary>
        /// <remarks>
        /// Перевіряє email та пароль. У разі успіху повертає JWT токен, який потрібно використовувати для авторизованих запитів.
        /// </remarks>
        /// <param name="request">Email та пароль користувача.</param>
        /// <returns>Об'єкт з JWT токеном та інформацією про користувача.</returns>
        /// <response code="200">Успішний вхід. Повертає токен.</response>
        /// <response code="400">Невірний email або пароль.</response>
        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email || u.Phone == request.Email);
            if (user == null)
            {
                return BadRequest("Невірний email, номер телефону або пароль.");
            }

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return BadRequest("Невірний email, номер телефону або пароль.");
            }

            string token = _jwtGenerator.GenerateToken(user);

            var response = new AuthResponseDto
            {
                Token = token,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role.ToString()
            };

            return Ok(response);
        }

        /// <summary>
        /// Запит на відновлення забутого паролю.
        /// </summary>
        /// <remarks>
        /// Генерує тимчасовий токен для скидання паролю. 
        /// У реальному середовищі цей токен надсилається на пошту, тут він повертається у відповіді для тестування.
        /// </remarks>
        /// <param name="request">Email користувача.</param>
        /// <returns>Токен для скидання паролю (Reset Token).</returns>
        /// <response code="200">Токен успішно згенеровано.</response>
        /// <response code="400">Користувача з таким email не знайдено.</response>
        [HttpPost("forgot-password")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return BadRequest("Користувача не знайдено.");
            }

            string token = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64));

            user.PasswordResetToken = token;
            user.ResetTokenExpires = DateTime.UtcNow.AddHours(1);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Токен створено (в реальності відправлено на пошту)", resetToken = token });
        }

        /// <summary>
        /// Встановлення нового паролю за допомогою токена відновлення.
        /// </summary>
        /// <param name="request">Токен відновлення та новий пароль.</param>
        /// <returns>Повідомлення про успішну зміну паролю.</returns>
        /// <response code="200">Пароль успішно змінено.</response>
        /// <response code="400">Невірний або прострочений токен.</response>
        [HttpPost("reset-password")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.PasswordResetToken == request.Token);

            if (user == null || user.ResetTokenExpires < DateTime.UtcNow)
            {
                return BadRequest("Невірний або прострочений токен.");
            }

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.PasswordHash = passwordHash;

            user.PasswordResetToken = null;
            user.ResetTokenExpires = null;

            await _context.SaveChangesAsync();

            return Ok("Пароль успішно змінено! Тепер можете увійти з новим паролем.");
        }

        /// <summary>
        /// Отримання профілю поточного користувача.
        /// </summary>
        /// <remarks>
        /// Вимагає наявності JWT токена в заголовку Authorization (Bearer Token).
        /// </remarks>
        /// <returns>Дані профілю (ID, Ім'я, Email, Роль).</returns>
        /// <response code="200">Успішне отримання профілю.</response>
        /// <response code="401">Користувач не авторизований (відсутній або невірний токен).</response>
        /// <response code="404">Користувача не знайдено в базі даних.</response>
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<UserProfileDto>> GetMe()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userIdString))
            {
                return Unauthorized();
            }

            int id = int.Parse(userIdString);

            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound("Користувача не знайдено");
            }

            var profile = new UserProfileDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Phone = user.Phone,
                Role = user.Role.ToString()
            };

            return Ok(profile);
        }
    }
}
