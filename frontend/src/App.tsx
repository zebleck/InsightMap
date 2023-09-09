import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Graph from "./pages/Graph";
import "easymde/dist/easymde.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import { Provider } from "react-redux";
import store from "./store/store";
import Main from "./pages/Main";
import { Container, Nav, Navbar } from "react-bootstrap";

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <Navbar bg="dark" variant="dark">
          <Container>
            <Navbar.Brand as={Link} to="/">
              InSightMap
            </Navbar.Brand>
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">
                Home
              </Nav.Link>
              <Nav.Link as={Link} to="/graph">
                Graph
              </Nav.Link>
            </Nav>
          </Container>
        </Navbar>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/:nodeName" element={<Main />} />
          <Route path="/graph" element={<Graph />} />
        </Routes>
      </Router>
    </Provider>
  );
};

export default App;
