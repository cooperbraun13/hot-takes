import type { MediaCategory } from "../types";

interface CategoryCardProps {
  category: MediaCategory;
}

function CategoryCard({ category }: CategoryCardProps) {
  function handleClick() {
    if (typeof window !== "undefined") {
      window.location.assign(category.path);
    }
  }

  return (
    <button className="category-card" onClick={handleClick}>
      <span className="category-icon">{category.icon}</span>
      <p>{category.name}</p>
    </button>
  );
}

export default CategoryCard;
