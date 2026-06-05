using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Threading.Tasks;

namespace FoodPreOrder.Api.Services
{
    public class FileStorageService : IFileStorageService
    {
        private readonly IWebHostEnvironment _env;

        public FileStorageService(IWebHostEnvironment env)
        {
            _env = env;
        }

        public async Task<string> SaveFileAsync(IFormFile file, string folderName = "images")
        {
            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);

            var folderPath = Path.Combine(_env.WebRootPath, folderName);

            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath);

            var filePath = Path.Combine(folderPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/{folderName}/{fileName}";
        }

        public Task DeleteFileAsync(string fileName)
        {
            if (string.IsNullOrEmpty(fileName)) return Task.CompletedTask;

            var filePath = Path.Combine(_env.WebRootPath, fileName.TrimStart('/'));

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            return Task.CompletedTask;
        }
    }
}
