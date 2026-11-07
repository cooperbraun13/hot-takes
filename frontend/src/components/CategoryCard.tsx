import { useNavigate } from "react-router-dom";
import type { MediaCategory } from "../types";

interface CategoryCardProps {
    category: MediaCategory;
}

function CategoryCard({ category }: CategoryCardProps) {
    const navigate = useNavigate();

    function handleClick() {
        navigate(category.path);
    }

    return (
        <button className="category-card" onClick={handleClick}>
            <span className="category-icon">{category.icon}</span>
            <p>{category.name}</p>
        </button>
    );
}

export default CategoryCard;
