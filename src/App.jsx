import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Write from "./pages/Write";
import MyPage from "./pages/MyPage";
import IdeaDetail from "./pages/IdeaDetail";
import Notifications from "./pages/Notifications";
import Ranking from "./pages/Ranking";
import CollabManage from "./pages/CollabManage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/write" element={<Write />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/idea/:id" element={<IdeaDetail />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/collab-manage" element={<CollabManage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
