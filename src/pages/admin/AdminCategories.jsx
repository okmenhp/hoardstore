import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

function AdminCategories() {
  const [categories, setCategories] = useState([]);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingSlug, setEditingSlug] = useState("");

  const [error, setError] = useState(null);

  useEffect(() => {
    getCategories();
  }, []);

  async function getCategories() {
    setError(null);

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setCategories(data);
  }

  async function handleCreate(e) {
    e.preventDefault();

    setError(null);

    if (!name.trim()) {
      setError("Vui lòng nhập tên danh mục.");
      return;
    }

    if (!slug.trim()) {
      setError("Vui lòng nhập slug.");
      return;
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: name.trim(),
        slug: slug.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setCategories((current) => [...current, data]);

    setName("");
    setSlug("");
  }

  function startEdit(category) {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingSlug(category.slug);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
    setEditingSlug("");
  }

  async function handleUpdate(id) {
    setError(null);

    if (!editingName.trim()) {
      setError("Vui lòng nhập tên danh mục.");
      return;
    }

    if (!editingSlug.trim()) {
      setError("Vui lòng nhập slug.");
      return;
    }

    const { data, error } = await supabase
      .from("categories")
      .update({
        name: editingName.trim(),
        slug: editingSlug.trim(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setCategories((current) =>
      current.map((category) => (category.id === id ? data : category)),
    );

    cancelEdit();
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Bạn có chắc muốn xóa danh mục này?");

    if (!confirmed) {
      return;
    }

    setError(null);

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      console.error(error);
      setError(`Xóa thất bại: ${error.message}`);
      return;
    }

    setCategories((current) =>
      current.filter((category) => category.id !== id),
    );
  }

  return (
    <div className="admin-category-page">
      {/* HEADER */}

      <div className="admin-page-header">
        <div>
          <h2>Quản lý danh mục</h2>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="admin-form-error">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{error}</span>
        </div>
      )}

      {/* THÊM DANH MỤC */}

      <div className="admin-form-card">
        <div className="admin-form-card__header">
          <div>
            <h3>Thêm danh mục</h3>
          </div>

          <i className="fa-solid fa-folder-plus"></i>
        </div>

        <div className="admin-form-card__body">
          <form onSubmit={handleCreate}>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label htmlFor="category-name">Tên danh mục</label>
                <input
                  id="category-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setName(value);

                    // Tự động tạo slug từ tên
                    const generatedSlug = value
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/đ/g, "d")
                      .replace(/[^a-z0-9\s-]/g, "")
                      .trim()
                      .replace(/\s+/g, "-")
                      .replace(/-+/g, "-");

                    setSlug(generatedSlug);
                  }}
                  placeholder="Ví dụ: Đột Kích"
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="category-slug">Slug</label>
                <input
                  id="category-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="dot-kich"
                />
                <small>
                  Slug được tự động tạo từ tên danh mục. Bạn vẫn có thể chỉnh
                  sửa.
                </small>
              </div>
            </div>

            <div className="admin-category-form-actions">
              <button type="submit" className="admin-primary-button">
                <i className="fa-solid fa-plus"></i>
                Thêm danh mục
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* DANH SÁCH */}

      <div className="admin-form-card">
        <div className="admin-form-card__header">
          <div>
            <h3>Danh sách danh mục</h3>

            <p>Hiện có {categories.length} danh mục.</p>
          </div>

          <i className="fa-solid fa-folder-tree"></i>
        </div>

        <div className="admin-form-card__body">
          {categories.length === 0 ? (
            <div className="admin-empty-category">
              <i className="fa-regular fa-folder-open"></i>

              <strong>Chưa có danh mục</strong>

              <span>Hãy tạo danh mục đầu tiên ở phía trên.</span>
            </div>
          ) : (
            <div className="admin-category-table-wrapper">
              <table className="admin-category-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên danh mục</th>
                    <th>Slug</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      {editingId === category.id ? (
                        <>
                          <td>
                            <span className="admin-category-id">
                              #{category.id}
                            </span>
                          </td>

                          <td>
                            <input
                              className="admin-table-input"
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                            />
                          </td>

                          <td>
                            <input
                              className="admin-table-input"
                              type="text"
                              value={editingSlug}
                              onChange={(e) => setEditingSlug(e.target.value)}
                            />
                          </td>

                          <td>
                            <div className="admin-table-actions">
                              <button
                                type="button"
                                className="admin-table-button save"
                                onClick={() => handleUpdate(category.id)}
                                title="Lưu"
                              >
                                <i className="fa-solid fa-check"></i>
                                <span>Lưu</span>
                              </button>

                              <button
                                type="button"
                                className="admin-table-button cancel"
                                onClick={cancelEdit}
                                title="Hủy"
                              >
                                <i className="fa-solid fa-xmark"></i>
                                <span>Hủy</span>
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <span className="admin-category-id">
                              #{category.id}
                            </span>
                          </td>

                          <td>
                            <strong className="admin-category-name">
                              {category.name}
                            </strong>
                          </td>

                          <td>
                            <span className="admin-category-slug">
                              {category.slug}
                            </span>
                          </td>

                          <td>
                            <div className="admin-table-actions">
                              <button
                                type="button"
                                className="admin-table-button edit"
                                onClick={() => startEdit(category)}
                                title="Sửa danh mục"
                              >
                                <i className="fa-solid fa-pen"></i>
                              </button>

                              <button
                                type="button"
                                className="admin-table-button delete"
                                onClick={() => handleDelete(category.id)}
                                title="Xóa danh mục"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminCategories;
