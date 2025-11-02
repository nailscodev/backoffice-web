import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import SimpleBar from "simplebar-react";
//import logo
import logoSm from "../assets/images/logo-sm.png";
import logoDark from "../assets/images/logo-dark.png";
import logoLight from "../assets/images/logo-light.png";

//Import Components
import VerticalLayout from "./VerticalLayouts";
import TwoColumnLayout from "./TwoColumnLayout";
import { Container } from "reactstrap";
import HorizontalLayout from "./HorizontalLayout";

const Sidebar = ({ layoutType } : any) => {

  const [isMinimized, setIsMinimized] = React.useState<boolean>(false);

  useEffect(() => {
    var verticalOverlay = document.getElementsByClassName("vertical-overlay");
    if (verticalOverlay) {
      verticalOverlay[0].addEventListener("click", function () {
        document.body.classList.remove("vertical-sidebar-enable");
      });
    }

    // Check if sidebar is minimized
    const checkSidebarSize = () => {
      const sidebarSize = document.documentElement.getAttribute('data-sidebar-size');
      setIsMinimized(sidebarSize === 'sm' || sidebarSize === 'sm-hover' || sidebarSize === 'sm-hover-active');
    };

    checkSidebarSize();
    
    // Observer to detect changes in sidebar size
    const observer = new MutationObserver(checkSidebarSize);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-sidebar-size']
    });

    return () => observer.disconnect();
  });

  const addEventListenerOnSmHoverMenu = () => {
    // add listener Sidebar Hover icon on change layout from setting
    if (document.documentElement.getAttribute('data-sidebar-size') === 'sm-hover') {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover-active');
    } else if (document.documentElement.getAttribute('data-sidebar-size') === 'sm-hover-active') {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover');
    } else {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover');
    }
  };

  return (
    <React.Fragment>
      <div className="app-menu navbar-menu">
        <div className="navbar-brand-box">
          <Link to="/" className="logo logo-dark">
            <span className="logo-sm" style={{ padding: '10px' }}>
              <img src={logoSm} alt="" height="auto" width="100%" />
            </span>
            <span className="logo-lg">
              <img src={logoDark} alt="" height="auto" width="100%" />
            </span>
          </Link>

          <Link to="/" className="logo logo-light">
            <span className="logo-sm" style={{ padding: '10px' }}>
              <img src={logoSm} alt="" height="auto" width="100%" />
            </span>
            <span className="logo-lg">
              <img src={logoLight} alt="" height="auto" width="100%" />
            </span>
          </Link>
          <button
            onClick={addEventListenerOnSmHoverMenu}
            type="button"
            className="btn btn-sm p-0 fs-20 header-item float-end btn-vertical-sm-hover"
            id="vertical-hover"
          >
            <i className="ri-record-circle-line"></i>
          </button>
        </div>
        {layoutType === "horizontal" ? (
          <div id="scrollbar">
            <Container fluid>
              <div id="two-column-menu"></div>
              <ul className="navbar-nav" id="navbar-nav">
                <HorizontalLayout />
              </ul>
            </Container>
          </div>
        ) : layoutType === 'twocolumn' ? (
          <React.Fragment>
            <TwoColumnLayout layoutType={layoutType} />
            <div className="sidebar-background"></div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <SimpleBar id="scrollbar" className="h-100">
              <Container fluid>
                <div id="two-column-menu"></div>
                <ul className="navbar-nav" id="navbar-nav" style={{ marginTop: isMinimized ? '15px' : '0' }}>
                  <VerticalLayout layoutType={layoutType} />
                </ul>
              </Container>
            </SimpleBar>
            <div className="sidebar-background"></div>
          </React.Fragment>
        )}
      </div>
      <div className="vertical-overlay"></div>
    </React.Fragment>
  );
};

export default Sidebar;
