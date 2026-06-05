using FoodPreOrder.Api.Services;
using FoodPreOrder.Application.DTOs.Admin;
using FoodPreOrder.Application.Interfaces;
using FoodPreOrder.Domain.Enums;
using FoodPreOrder.Persistence.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FoodPreOrder.Api.Controllers
{
    /// <summary>
    /// Контролер для аналітики та звітності.
    /// Забезпечує генерацію фінансових звітів, аналіз популярності страв та завантаженості ресторану.
    /// Підтримує експорт даних у форматі PDF.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class StatisticsController : ControllerBase
    {
        private readonly IStatisticsService _statsService;
        private readonly ApplicationDbContext _context;
        private readonly PdfReportService _pdfService;

        public StatisticsController(IStatisticsService statsService, ApplicationDbContext context, PdfReportService pdfService)
        {
            _statsService = statsService;
            _context = context;
            _pdfService = pdfService;
        }

        /// <summary>
        /// Отримує статистику доходів та кількості замовлень по днях за вказаний період.
        /// </summary>
        /// <param name="restaurantId">ID ресторану.</param>
        /// <param name="from">Початкова дата періоду.</param>
        /// <param name="to">Кінцева дата періоду.</param>
        /// <returns>Список щоденної статистики (JSON).</returns>
        [HttpGet("restaurant/{restaurantId}/daily")]
        [Authorize(Roles = "Admin,RestaurantOwner")]
        [ProducesResponseType(typeof(List<DailyStatsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<List<DailyStatsDto>>> GetDailyStats(int restaurantId, [FromQuery] DateTime from, [FromQuery] DateTime to)
        {
            if (!await CheckAccess(restaurantId)) return StatusCode(403, "Це не ваш ресторан");
            var stats = await _statsService.GetDailyStatsAsync(restaurantId, from, to);
            return Ok(stats);
        }

        /// <summary>
        /// Генерує та завантажує PDF-звіт з фінансовою статистикою за період.
        /// </summary>
        /// <param name="restaurantId">ID ресторану.</param>
        /// <param name="from">Початкова дата.</param>
        /// <param name="to">Кінцева дата.</param>
        /// <returns>Файл PDF.</returns>
        [HttpGet("restaurant/{restaurantId}/report/pdf")]
        [Authorize(Roles = "Admin,RestaurantOwner")]
        [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> DownloadReportPdf(int restaurantId, [FromQuery] DateTime from, [FromQuery] DateTime to)
        {
            if (!await CheckAccess(restaurantId)) return StatusCode(403, "Це не ваш ресторан");

            var stats = await _statsService.GetDailyStatsAsync(restaurantId, from, to);
            var restaurant = await _context.Restaurants.FindAsync(restaurantId);

            var pdfFile = _pdfService.GenerateFinancialReport(restaurant.NameUA, from, to, stats);

            return File(pdfFile, "application/pdf", $"FinancialReport_{from:yyyyMMdd}-{to:yyyyMMdd}.pdf");
        }

        /// <summary>
        /// Завантажує детальний журнал замовлень за конкретну дату у форматі PDF.
        /// </summary>
        /// <param name="restaurantId">ID ресторану.</param>
        /// <param name="date">Дата звіту.</param>
        /// <returns>Файл PDF з логом операцій.</returns>
        [HttpGet("restaurant/{restaurantId}/daily-log/pdf")]
        [Authorize(Roles = "Admin,RestaurantOwner")]
        [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> DownloadDailyLogPdf(int restaurantId, [FromQuery] DateTime date)
        {
            if (!await CheckAccess(restaurantId)) return StatusCode(403, "Це не ваш ресторан");

            var logs = await _statsService.GetDailyOrderLogAsync(restaurantId, date);
            var restaurant = await _context.Restaurants.FindAsync(restaurantId);

            var pdfFile = _pdfService.GenerateDailyLogReport(restaurant.NameUA, date, logs);

            return File(pdfFile, "application/pdf", $"DailyLog_{date:yyyyMMdd}.pdf");
        }

        /// <summary>
        /// Аналіз пікового навантаження. Показує кількість замовлень у розрізі годин доби.
        /// </summary>
        /// <param name="restaurantId">ID ресторану.</param>
        /// <param name="from">Початкова дата.</param>
        /// <param name="to">Кінцева дата.</param>
        /// <returns>Статистика по годинах (JSON).</returns>
        [HttpGet("restaurant/{restaurantId}/peak-hours")]
        [Authorize(Roles = "Admin,RestaurantOwner")]
        [ProducesResponseType(typeof(List<PeakLoadDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<List<PeakLoadDto>>> GetPeakHours(
            int restaurantId,
            [FromQuery] DateTime from,
            [FromQuery] DateTime to)
        {
            if (!await CheckAccess(restaurantId)) return StatusCode(403, "Це не ваш ресторан");

            var peaks = await _statsService.GetPeakLoadingAsync(restaurantId, from, to);
            return Ok(peaks);
        }

        /// <summary>
        /// Завантажує PDF-звіт про пікові години навантаження.
        /// </summary>
        /// <returns>Файл PDF.</returns>
        [HttpGet("restaurant/{restaurantId}/peak-hours/pdf")]
        [Authorize(Roles = "Admin,RestaurantOwner")]
        [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> DownloadPeakHoursPdf(
            int restaurantId,
            [FromQuery] DateTime from,
            [FromQuery] DateTime to)
        {
            if (!await CheckAccess(restaurantId)) return StatusCode(403, "Це не ваш ресторан");

            var peaks = await _statsService.GetPeakLoadingAsync(restaurantId, from, to);
            var restaurant = await _context.Restaurants.FindAsync(restaurantId);

            var pdfFile = _pdfService.GeneratePeakHoursReport(restaurant.NameUA, peaks);
            string fileName = $"PeakHours_{from:yyyyMMdd}-{to:yyyyMMdd}.pdf";

            return File(pdfFile, "application/pdf", fileName);
        }

        /// <summary>
        /// Отримує рейтинг найпопулярніших страв за кількістю продажів.
        /// </summary>
        /// <param name="restaurantId">ID ресторану.</param>
        /// <returns>Список ТОП страв (JSON).</returns>
        [HttpGet("restaurant/{restaurantId}/top-dishes")]
        [Authorize(Roles = "Admin,RestaurantOwner")]
        [ProducesResponseType(typeof(List<TopDishDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<List<TopDishDto>>> GetTopDishes(int restaurantId)
        {
            if (!await CheckAccess(restaurantId)) return StatusCode(403, "Це не ваш ресторан");
            var tops = await _statsService.GetTopDishesAsync(restaurantId);
            return Ok(tops);
        }

        /// <summary>
        /// Завантажує PDF-звіт з рейтингом популярних страв.
        /// </summary>
        /// <returns>Файл PDF.</returns>
        [HttpGet("restaurant/{restaurantId}/top-dishes/pdf")]
        [Authorize(Roles = "Admin,RestaurantOwner")]
        [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> DownloadTopDishesPdf(int restaurantId)
        {
            if (!await CheckAccess(restaurantId)) return StatusCode(403, "Це не ваш ресторан");

            var tops = await _statsService.GetTopDishesAsync(restaurantId);
            var restaurant = await _context.Restaurants.FindAsync(restaurantId);

            var pdfFile = _pdfService.GenerateTopDishesReport(restaurant.NameUA, tops);

            return File(pdfFile, "application/pdf", "TopDishes.pdf");
        }

        /// <summary>
        /// Глобальна аналітика системи (Dashboard).
        /// </summary>
        /// <remarks>
        /// Доступно тільки для Адміністратора системи. Показує загальну кількість користувачів, ресторанів та обіг коштів.
        /// </remarks>
        /// <returns>Дані для дашборду.</returns>
        [HttpGet("admin/dashboard")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(AdminDashboardDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<ActionResult<AdminDashboardDto>> GetAdminDashboard()
        {
            var dashboard = await _statsService.GetSystemDashboardAsync();
            return Ok(dashboard);
        }

        /// <summary>
        /// Завантажує глобальний звіт по системі у форматі PDF (для Адміністратора).
        /// </summary>
        /// <returns>Файл PDF.</returns>
        [HttpGet("admin/dashboard/pdf")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> DownloadAdminDashboardPdf()
        {
            var dashboardData = await _statsService.GetSystemDashboardAsync();
            var pdfFile = _pdfService.GenerateSystemDashboardReport(dashboardData);

            string fileName = $"System_Dashboard_{DateTime.Now:yyyyMMdd_HHmm}.pdf";
            return File(pdfFile, "application/pdf", fileName);
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
