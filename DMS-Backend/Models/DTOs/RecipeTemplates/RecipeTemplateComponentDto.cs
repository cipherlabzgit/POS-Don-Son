namespace DMS_Backend.Models.DTOs.RecipeTemplates;

public class RecipeTemplateComponentDto
{
    public Guid Id { get; set; }
    public Guid RecipeTemplateId { get; set; }
    public Guid ProductionSectionId { get; set; }
    public string ProductionSectionName { get; set; } = string.Empty;
    public string ComponentName { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public List<RecipeTemplateIngredientDto> Ingredients { get; set; } = new();
}

public class RecipeTemplateIngredientDto
{
    public Guid Id { get; set; }
    public Guid RecipeTemplateComponentId { get; set; }
    public Guid IngredientId { get; set; }
    public string IngredientCode { get; set; } = string.Empty;
    public string IngredientName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal QtyPerUnit { get; set; }
    public decimal ExtraQtyPerUnit { get; set; }
    public bool StoresOnly { get; set; }
    public bool ShowExtraInStores { get; set; }
    public int SortOrder { get; set; }
}

public class CreateRecipeTemplateComponentDto
{
    public Guid RecipeTemplateId { get; set; }
    public Guid ProductionSectionId { get; set; }
    public string ComponentName { get; set; } = string.Empty;
    public int SortOrder { get; set; } = 0;
    public List<CreateRecipeTemplateIngredientDto> Ingredients { get; set; } = new();
}

public class CreateRecipeTemplateIngredientDto
{
    public Guid IngredientId { get; set; }
    public decimal QtyPerUnit { get; set; }
    public decimal ExtraQtyPerUnit { get; set; }
    public bool StoresOnly { get; set; } = false;
    public bool ShowExtraInStores { get; set; } = false;
    public int SortOrder { get; set; } = 0;
}

public class UpdateRecipeTemplateComponentDto
{
    public string? ComponentName { get; set; }
    public Guid? ProductionSectionId { get; set; }
    public int? SortOrder { get; set; }
}

public class UpdateRecipeTemplateIngredientDto
{
    public decimal? QtyPerUnit { get; set; }
    public decimal? ExtraQtyPerUnit { get; set; }
    public bool? StoresOnly { get; set; }
    public bool? ShowExtraInStores { get; set; }
    public int? SortOrder { get; set; }
}

/// <summary>
/// Used to load a recipe template's components+ingredients into a recipe as a starting point.
/// </summary>
public class LoadFromTemplateDto
{
    public Guid RecipeTemplateId { get; set; }
    public Guid RecipeId { get; set; }
    /// <summary>If true, replaces all existing components. If false, merges/appends.</summary>
    public bool ReplaceExisting { get; set; } = false;
}
