using FoodPreOrder.Application.DTOs.Admin;
using FoodPreOrder.Application.Interfaces;
using FoodPreOrder.Domain.Entities;
using FoodPreOrder.Domain.Enums;
using FoodPreOrder.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace FoodPreOrder.Api.Services
{
    public class VerificationService : IVerificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileStorageService _fileStorage;

        public VerificationService(ApplicationDbContext context, IFileStorageService fileStorage)
        {
            _context = context;
            _fileStorage = fileStorage;
        }

        public async Task SubmitRequestAsync(int userId, IFormFile document)
        {
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
            var extension = Path.GetExtension(document.FileName).ToLower();

            if (!allowedExtensions.Contains(extension))
            {
                throw new ArgumentException("Недопустимий формат файлу. Дозволено: JPG, PNG, PDF.");
            }

            string filePath = await _fileStorage.SaveFileAsync(document, "documents");

            var request = new VerificationRequest
            {
                UserId = userId,
                DocumentUrl = filePath,
                Status = VerificationStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.VerificationRequests.Add(request);
            await _context.SaveChangesAsync();
        }

        public async Task<List<VerificationRequest>> GetPendingRequestsAsync()
        {
            return await _context.VerificationRequests
                .Include(r => r.User)
                .Where(r => r.Status == VerificationStatus.Pending)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> ProcessRequestAsync(int adminId, ProcessVerificationDto dto)
        {
            var request = await _context.VerificationRequests
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == dto.RequestId);

            if (request == null || request.Status != VerificationStatus.Pending)
                return false;

            request.Status = dto.IsApproved ? VerificationStatus.Approved : VerificationStatus.Rejected;
            request.ProcessedAt = DateTime.UtcNow;
            request.AdminComment = dto.Comment;

            if (dto.IsApproved && request.User != null)
            {
                request.User.Role = UserRole.RestaurantOwner;

                var log = new ActivityLog
                {
                    UserId = adminId,
                    Action = "OwnerApproved",
                    EntityName = "Users",
                    EntityId = request.UserId.ToString(),
                    Details = $"Верифікацію пройдено. Роль змінено на RestaurantOwner. Документ: {request.DocumentUrl}",
                    Timestamp = DateTime.UtcNow
                };
                _context.ActivityLogs.Add(log);

                var notification = new Notification
                {
                    UserId = request.UserId,
                    Message = "Вітаємо! Ваш акаунт верифіковано. Тепер ви маєте статус Власника і можете створювати ресторани.",
                    DateSent = DateTime.UtcNow,
                    IsRead = false
                };
                _context.Notifications.Add(notification);
            }
            else if (!dto.IsApproved)
            {
                var log = new ActivityLog
                {
                    UserId = adminId,
                    Action = "OwnerRejected",
                    EntityName = "VerificationRequests",
                    EntityId = request.Id.ToString(),
                    Details = $"Відмова у верифікації. Причина: {dto.Comment}",
                    Timestamp = DateTime.UtcNow
                };
                _context.ActivityLogs.Add(log);

                var notification = new Notification
                {
                    UserId = request.UserId,
                    Message = $"Верифікацію відхилено. Причина: {dto.Comment}",
                    DateSent = DateTime.UtcNow,
                    IsRead = false
                };
                _context.Notifications.Add(notification);
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
