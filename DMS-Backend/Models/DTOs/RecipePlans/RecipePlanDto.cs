namespace DMS_Backend.Models.DTOs.RecipePlans;

public class RecipePlanListDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsDefault { get; set; }
    public int SortOrder { get; set; }
    public int ItemCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RecipePlanDetailDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsDefault { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public List<RecipePlanItemDto> Items { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class RecipePlanItemDto
{
    public Guid Id { get; set; }
    public Guid RecipePlanId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public Guid RecipeId { get; set; }
    public string RecipeName { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class CreateRecipePlanDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsDefault { get; set; } = false;
    public int SortOrder { get; set; } = 0;
    public List<CreateRecipePlanItemDto> Items { get; set; } = new();
}

public class CreateRecipePlanItemDto
{
    public Guid ProductId { get; set; }
    public Guid RecipeId { get; set; }
    public string? Notes { get; set; }
}

public class UpdateRecipePlanDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public DateTime? EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool? IsDefault { get; set; }
    public int? SortOrder { get; set; }
}
