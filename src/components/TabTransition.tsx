import { useEffect, useState, useRef, type ReactNode } from "react";

interface TabTransitionProps {
  tabKey: string;
  children: ReactNode;
}

const TabTransition = ({ tabKey, children }: TabTransitionProps) => {
  const [show, setShow] = useState(false);
  const prevKey = useRef(tabKey);

  useEffect(() => {
    if (tabKey !== prevKey.current) {
      setShow(false);
      const t = setTimeout(() => {
        prevKey.current = tabKey;
        setShow(true);
      }, 50);
      return () => clearTimeout(t);
    } else {
      setShow(true);
    }
  }, [tabKey]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      {children}
    </div>
  );
};

export default TabTransition;
