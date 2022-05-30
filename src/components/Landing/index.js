import React from 'react';
import { Link } from 'react-router-dom';

import './stylesheet.css';
import logo from '../../images/organice.svg';
import ExternalLink from '../UI/ExternalLink';

export default () => {
  return (
    <>
      <link href="https://200ok.ch/landing_page/css/styles.css" rel="stylesheet" />
      <link rel="stylesheet" href="landing_page/css/aos.css" />
      <link
        rel="icon"
        type="image/x-icon"
        href="https://200ok.ch/landing_page/img/organice/favicon.ico"
      />
      <script
        data-search-pseudo-elements
        defer
        src="https://200ok.ch/landing_page/js/font_awesome_all.min.js"
        crossOrigin="anonymous"
      ></script>
      <script src="https://200ok.ch//js/vendor/jquery.min.js"></script>
      <script src="https://200ok.ch/landing_page/js/false_bottom.js"></script>
      <script
        src="https://200ok.ch/landing_page/js/feather_icons.min.js"
        crossOrigin="anonymous"
      ></script>

      <div></div>

      <div id="layoutDefault">
        <div id="layoutDefault_content">
          <main>
            {/* Navbar */}
            {/* <nav className="navbar navbar-marketing navbar-expand-lg bg-transparent navbar-dark fixed-top"> */}
            {/*   <div className="container px-5"> */}
            {/*     <a className="navbar-brand text-white" href="#"> */}
            {/*       <img */}
            {/*         src="landing_page/img/organice/organice-512x512.png" */}
            {/*         style={{ height: '4rem' }} */}
            {/*       /> */}
            {/*     </a> */}
            {/*     <button */}
            {/*       className="navbar-toggler" */}
            {/*       type="button" */}
            {/*       data-bs-toggle="collapse" */}
            {/*       data-bs-target="#navbarSupportedContent" */}
            {/*       aria-controls="navbarSupportedContent" */}
            {/*       aria-expanded="false" */}
            {/*       aria-label="Toggle navigation" */}
            {/*     > */}
            {/*       <i data-feather="menu"></i> */}
            {/*     </button> */}
            {/*     <div className="collapse navbar-collapse" id="navbarSupportedContent"> */}
            {/*       <ul className="navbar-nav ms-auto me-lg-5"> */}
            {/*         <li className="nav-item"> */}
            {/*           <a className="nav-link navbar-brand" href="/"> */}
            {/*             Home */}
            {/*           </a> */}
            {/*         </li> */}

            {/*         <li className="nav-item"> */}
            {/*           <a */}
            {/*             target="_blank" */}
            {/*             className="nav-link navbar-brand" */}
            {/*             href="https://github.com/sponsors/200ok-ch" */}
            {/*             rel="noreferrer" */}
            {/*           > */}
            {/*             Pricing */}
            {/*           </a> */}
            {/*         </li> */}

            {/*         <li className="nav-item"> */}
            {/*           <a */}
            {/*             target="_blank" */}
            {/*             className="nav-link navbar-brand" */}
            {/*             href="https://github.com/200ok-ch/organice" */}
            {/*             rel="noreferrer" */}
            {/*           > */}
            {/*             Code */}
            {/*           </a> */}
            {/*         </li> */}

            {/*         <li className="nav-item"> */}
            {/*           <a */}
            {/*             target="_blank" */}
            {/*             className="nav-link navbar-brand" */}
            {/*             href="https://organice.200ok.ch/documentation.html" */}
            {/*             rel="noreferrer" */}
            {/*           > */}
            {/*             Documentation */}
            {/*           </a> */}
            {/*         </li> */}
            {/*       </ul> */}
            {/*       <a */}
            {/*         className="btn fw-500 ms-lg-4 btn-teal" */}
            {/*         href="https://organice.200ok.ch/sign_in" */}
            {/*       > */}
            {/*         Sign in */}
            {/*         <i className="ms-2" data-feather="arrow-right"></i> */}
            {/*       </a> */}
            {/*     </div> */}
            {/*   </div> */}
            {/* </nav> */}
            {/* Page Header */}
          </main>
        </div>
      </div>
    </>
  );
};
