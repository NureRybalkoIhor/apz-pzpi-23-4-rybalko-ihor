namespace FoodPreOrder.Api.Services
{
    public interface IFileStorageService
    {
        Task<string> SaveFileAsync(IFormFile file, string folderName = "images");

        Task DeleteFileAsync(string fileName);
    }
}
