// Add / edit now opens as a slide-in form on the Products page.
// These old links (/products/add, /products/:id/edit) just forward there.
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(id ? `/products?edit=${id}` : "/products?add=1", { replace: true });
  }, [id, navigate]);

  return null;
}
