import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Write from "./pages/Write";
import MyPage from "./pages/MyPage";
import IdeaDetail from "./pages/IdeaDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/write" element={<Write />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/idea/:id" element={<IdeaDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
