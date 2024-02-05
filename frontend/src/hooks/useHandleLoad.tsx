import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchNode } from "../store/graphSlice";
import { AppDispatch } from "../store/store";

export const useHandleLoad = () => {
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();

  const handleLoad = (e, nodeName) => {
    e.preventDefault();
    navigate(`/${nodeName}`);
    if (nodeName)
      dispatch(fetchNode(nodeName));
  };

  return handleLoad;
};
