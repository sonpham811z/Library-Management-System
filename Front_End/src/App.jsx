import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { store } from "./app/store";
import { MainLayout } from "./components/layout/MainLayout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";

// Auth
import { LoginPage } from "./pages/auth/LoginPage";

// Admin pages
import { DashboardPage }        from "./pages/admin/DashboardPage";
import { BooksPage }            from "./pages/admin/BooksPage";
import { BookCopiesPage }       from "./pages/admin/BookCopiesPage";
import { UsersPage }            from "./pages/admin/UsersPage";
import { BorrowsPage }          from "./pages/admin/BorrowsPage";
import { FinesPage }            from "./pages/admin/FinesPage";
import { ReaderCardsPage }      from "./pages/admin/ReaderCardsPage";
import { ReportsPage }          from "./pages/admin/ReportsPage";
import { PoliciesPage }         from "./pages/admin/PoliciesPage";
import { ReservationsPage }     from "./pages/admin/ReservationsPage";
import { AuthorsPage }          from "./pages/admin/AuthorsPage";
import { CategoriesPage }       from "./pages/admin/CategoriesPage";
import { ReaderCategoriesPage } from "./pages/admin/ReaderCategoriesPage";

// Staff pages
import { StaffDashboardPage }        from "./pages/staff/StaffDashboardPage";
import { StaffBooksPage }            from "./pages/staff/StaffBooksPage";
import { StaffBookCopiesPage }       from "./pages/staff/StaffBookCopiesPage";
import { StaffReaderCardsPage }      from "./pages/staff/StaffReaderCardsPage";
import { StaffBorrowsPage }          from "./pages/staff/StaffBorrowsPage";
import { StaffFinesPage }            from "./pages/staff/StaffFinesPage";
import { StaffReportsPage }          from "./pages/staff/StaffReportsPage";
import { StaffReservationsPage }     from "./pages/staff/StaffReservationsPage";
import { StaffAuthorsPage }          from "./pages/staff/StaffAuthorsPage";
import { StaffCategoriesPage }       from "./pages/staff/StaffCategoriesPage";
import { StaffReaderCategoriesPage } from "./pages/staff/StaffReaderCategoriesPage";

// Reader pages
import { SearchPage }          from "./pages/reader/SearchPage";
import { MyProfilePage }       from "./pages/reader/MyProfilePage";
import { MyBorrowsPage }       from "./pages/reader/MyBorrowsPage";
import { MyReservationsPage }  from "./pages/reader/MyReservationsPage";
import { MyFinesPage }         from "./pages/reader/MyFinesPage";

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* ── ADMIN routes ── */}
          <Route
            path="/"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"         element={<DashboardPage />} />
            <Route path="books"             element={<BooksPage />} />
            <Route path="book-copies"       element={<BookCopiesPage />} />
            <Route path="reader-cards"      element={<ReaderCardsPage />} />
            <Route path="authors"           element={<AuthorsPage />} />
            <Route path="categories"        element={<CategoriesPage />} />
            <Route path="borrows"           element={<BorrowsPage />} />
            <Route path="fines"             element={<FinesPage />} />
            <Route path="reports"           element={<ReportsPage />} />
            <Route path="users"             element={<UsersPage />} />
            <Route path="policies"          element={<PoliciesPage />} />
            <Route path="reservations"      element={<ReservationsPage />} />
            <Route path="reader-categories" element={<ReaderCategoriesPage />} />
          </Route>

          {/* ── STAFF routes ── */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute roles={["STAFF"]}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="dashboard"         element={<StaffDashboardPage />} />
            <Route path="books"             element={<StaffBooksPage />} />
            <Route path="book-copies"       element={<StaffBookCopiesPage />} />
            <Route path="authors"           element={<StaffAuthorsPage />} />
            <Route path="categories"        element={<StaffCategoriesPage />} />
            <Route path="reader-cards"      element={<StaffReaderCardsPage />} />
            <Route path="borrows"           element={<StaffBorrowsPage />} />
            <Route path="fines"             element={<StaffFinesPage />} />
            <Route path="reports"           element={<StaffReportsPage />} />
            <Route path="reservations"      element={<StaffReservationsPage />} />
            <Route path="reader-categories" element={<StaffReaderCategoriesPage />} />
          </Route>

          {/* ── READER routes ── */}
          <Route
            path="/"
            element={
              <ProtectedRoute roles={["READER"]}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="my-profile"      element={<MyProfilePage />} />
            <Route path="search"          element={<SearchPage />} />
            <Route path="my-borrows"      element={<MyBorrowsPage />} />
            <Route path="my-reservations" element={<MyReservationsPage />} />
            <Route path="my-fines"        element={<MyFinesPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}
