FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /app

# Copy sln and csproj files for restoring dependencies
COPY *.sln .
COPY FoodPreOrder.Api/*.csproj ./FoodPreOrder.Api/
COPY FoodPreOrder.Application/*.csproj ./FoodPreOrder.Application/
COPY FoodPreOrder.Domain/*.csproj ./FoodPreOrder.Domain/
COPY FoodPreOrder.Infrastructure/*.csproj ./FoodPreOrder.Infrastructure/
COPY FoodPreOrder.Persistence/*.csproj ./FoodPreOrder.Persistence/
COPY FoodPreOrder.Tests/*.csproj ./FoodPreOrder.Tests/
RUN dotnet restore

# Copy all code files and build the release app
COPY . .
RUN dotnet publish FoodPreOrder.Api/FoodPreOrder.Api.csproj -c Release -o out

# Build final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build-env /app/out .

EXPOSE 80
ENTRYPOINT ["dotnet", "FoodPreOrder.Api.dll"]
