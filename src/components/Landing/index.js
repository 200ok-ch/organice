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
            <nav className="navbar navbar-marketing navbar-expand-lg bg-transparent navbar-dark fixed-top">
              <div className="container px-5">
                <a className="navbar-brand text-white" href="#">
                  <img
                    src="https://200ok.ch/landing_page/img/organice/organice-512x512.png"
                    style={{ height: '4rem' }}
                  />
                </a>
                <button
                  className="navbar-toggler"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#navbarSupportedContent"
                  aria-controls="navbarSupportedContent"
                  aria-expanded="false"
                  aria-label="Toggle navigation"
                >
                  <i data-feather="menu"></i>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                  <ul className="navbar-nav ms-auto me-lg-5">
                    <li className="nav-item">
                      <a className="nav-link navbar-brand" href="/">
                        Home
                      </a>
                    </li>

                    <li className="nav-item">
                      <a
                        target="_blank"
                        className="nav-link navbar-brand"
                        href="https:github.com/sponsors/200ok-ch"
                        rel="noreferrer"
                      >
                        Pricing
                      </a>
                    </li>

                    <li className="nav-item">
                      <a
                        target="_blank"
                        className="nav-link navbar-brand"
                        href="https:github.com/200ok-ch/organice"
                        rel="noreferrer"
                      >
                        Code
                      </a>
                    </li>

                    <li className="nav-item">
                      <a
                        target="_blank"
                        className="nav-link navbar-brand"
                        href="https:organice.200ok.ch/documentation.html"
                        rel="noreferrer"
                      >
                        Documentation
                      </a>
                    </li>
                  </ul>
                  <a className="btn fw-500 ms-lg-4 btn-teal" href="https:organice.200ok.ch/sign_in">
                    Sign in
                    <i className="ms-2" data-feather="arrow-right"></i>
                  </a>
                </div>
              </div>
            </nav>
            {/* Page Header */}
            <header className="page-header-ui page-header-ui-dark bg-gradient-primary-to-secondary">
              <div className="page-header-ui-content pt-10">
                <div className="container px-5">
                  <div className="row gx-5 align-items-center">
                    <div className="col-lg-6" data-aos="fade-up">
                      <h1 className="page-header-ui-title">
                        organice is the best way to get stuff done
                      </h1>
                      <p className="page-header-ui-text mb-5">
                        <p>
                          Whether you're planning multiple work projects, sharing a shopping list
                          with your partner or you're planing a holiday, organice is here to help
                          you complete all your personal and professional tasks.
                        </p>
                        <p>
                          organice is Free and Open Source software that works on top of Org mode
                          files.
                        </p>

                        <a
                          className="btn btn-teal fw-500 me-2"
                          href="https://organice.200ok.ch/sample"
                        >
                          Live demo
                          <i className="ms-2" data-feather="arrow-right"></i>
                        </a>

                        <a
                          className="btn btn-white fw-500 me-2"
                          href="https://organice.200ok.ch/sign_in"
                        >
                          Sign In
                          <i className="ms-2" data-feather="arrow-right"></i>
                        </a>
                      </p>
                      <div
                        className="col-lg-6 mt-5 mt-lg-0 d-lg-block text-center"
                        data-aos="fade-up"
                        data-aos-delay="100"
                      >
                        <img
                          className="img-fluid main-image"
                          alt=""
                          src="landing_page/img/organice/screenshot-overview.png"
                          style={{ filter: 'drop-shadow(0.5em 0.5em 0.5em #444)' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="svg-border-rounded text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 144.54 17.34"
                    preserveAspectRatio="none"
                    fill="currentColor"
                  >
                    <path d="M144.54,17.34H0V0H144.54ZM0,0S32.36,17.34,72.27,17.34,144.54,0,144.54,0"></path>
                  </svg>
                </div>
              </div>
            </header>

            <div className="row">
              <div id="false-bottom-preventor" className="fixed-bottom text-end">
                <p>
                  Learn more <i className="fas fa-arrow-circle-down"></i>
                </p>
              </div>
              <section className="bg-white py-10">
                <div className="container px-5">
                  <div className="row gx-5 text-center">
                    <div className="col-lg-4 mb-5 mb-lg-0">
                      <div className="icon-stack icon-stack-xl bg-gradient-primary-to-secondary text-white mb-4">
                        <i data-feather="check-square"></i>
                      </div>
                      <h3>Plan for anything</h3>
                      <p className="mb-0">
                        Organize and share your to-do, work, grocery, movies and household lists. No
                        matter what you’re planning, how big or small the task may be, organice
                        makes it super easy to get stuff done.
                      </p>
                    </div>

                    <div className="col-lg-4 mb-5 mb-lg-0">
                      <div className="icon-stack icon-stack-xl bg-gradient-primary-to-secondary text-white mb-4">
                        <i data-feather="calendar"></i>
                      </div>
                      <h3>See your agenda anytime</h3>
                      <p className="mb-0">
                        Set schedules and deadlines on to-dos. No matter whether your tasks are work
                        related or just for fun, you will never miss a deadline again with organice
                        in charge.
                      </p>
                    </div>

                    <div className="col-lg-4 mb-5 mb-lg-0">
                      <div className="icon-stack icon-stack-xl bg-gradient-primary-to-secondary text-white mb-4">
                        <i data-feather="eye-off"></i>
                      </div>
                      <h3>Privacy and freedom first</h3>
                      <p className="mb-0">
                        organice is Free and Open Source software protecting your freedom to run,
                        copy, distribute, study, change and improve the software. Your most
                        important data should never be in a closed silo.
                        <br />
                        <br />
                        We also never see your data - only you and your personal storage provider
                        does. organice saves your files in the free format Org mode, so you can
                        always access it with any tool at any time!
                      </p>
                    </div>
                  </div>

                  <div id="icons" className="row pt-10 d-flex flex-wrap align-items-center">
                    <h1 className="text-center mb-5">Access from anywhere</h1>
                    <strong className="text-center mb-5">
                      Available on iPhone, Android, and the Web, organice works seamlessly across
                      all major devices.
                    </strong>

                    <div className="col-md-4">
                      <i className="fas fa-mobile-alt"></i>
                    </div>

                    <div className="col-md-4">
                      <i className="fab fa-android"></i>
                    </div>

                    <div className="col-md-4">
                      <i className="fab fa-firefox-browser"></i>
                    </div>
                  </div>
                </div>

                <div className="svg-border-rounded text-light">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 144.54 17.34"
                    preserveAspectRatio="none"
                    fill="currentColor"
                  >
                    <path d="M144.54,17.34H0V0H144.54ZM0,0S32.36,17.34,72.27,17.34,144.54,0,144.54,0"></path>
                  </svg>
                </div>
              </section>

              <section className="bg-light py-10">
                <div className="container px-5">
                  <div className="row gx-5 align-items-center justify-content-center">
                    <div className="col-md-9 col-lg-6 order-1 order-lg-0" data-aos="fade-right">
                      <div className="content-skewed content-skewed-right">
                        <img
                          className="content-skewed-item img-fluid shadow-lg rounded-3"
                          src="landing_page/img/organice/screenshot-wide.png"
                          alt="Sample organice document"
                        />
                      </div>
                    </div>
                    <div className="col-lg-6 order-0 order-lg-1 mb-5 mb-lg-0" data-aos="fade-left">
                      <div className="mb-5">
                        <h2>Remember all the things</h2>
                        <p className="lead">Succeed with every project</p>
                      </div>

                      <div className="row gx-5">
                        <div className="col-md-6 mb-4">
                          <h6>Work anywhere</h6>
                          <p className="mb-2 small mb-0">
                            organice works on all major platforms, so you can access your
                            information wherever you are.
                          </p>
                        </div>

                        <div className="col-md-6 mb-4">
                          <h6>Find your content quickly</h6>
                          <p className="mb-2 small mb-0">
                            Thanks to a flexible query language and a bookmarking system, you can
                            find your important content quickly and reliably.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="m-0" />

              <section className="bg-dark py-10">
                <div className="container px-5">
                  <div className="row gx-5 my-10">
                    <div className="col-lg-6 mb-5">
                      <div className="d-flex h-100">
                        <div className="icon-stack flex-shrink-0 bg-teal text-white">
                          <i className="fas fa-question"></i>
                        </div>

                        <div className="ms-4">
                          <h5 className="text-white">Intro video</h5>
                          <p className="text-white-50">
                            If you are interested into the 'why did we get started with organice',
                            we have got you covered. For{' '}
                            <a target="_blank" href="https://emacsconf.org/2019/" rel="noreferrer">
                              {' '}
                              EmacsConf 2019
                            </a>
                            , we have created a 10 minute introductory video into the rationale and
                            usability of organice.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-6 mb-5">
                      <div className="d-flex h-100">
                        <div className="ms-4">
                          <h5 className="text-white"></h5>
                          <p className="text-white-50">
                            <iframe
                              width="560"
                              height="315"
                              src="https://www.youtube.com/embed/aQKc0hcFXCk"
                              title="YouTube video player"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row gx-5 justify-content-center text-center">
                    <div className="col-lg-8">
                      <div className="badge bg-transparent-light rounded-pill badge-marketing mb-4"></div>
                      <h2 className="text-white">Get started</h2>
                      <p className="lead text-white-50 mb-5">
                        <p>
                          organice is{' '}
                          <a
                            target="_blank"
                            href="https://www.gnu.org/philosophy/free-sw.en.html"
                            rel="noreferrer"
                          >
                            free software
                          </a>{' '}
                          and will stay this way. Leave the closed silos behind and let your
                          knowledge roam free. Start with the live demo - you don't even need to
                          sign up. Check it out first and sign up later.
                        </p>
                      </p>

                      <a className="btn btn-teal fw-500" href="https://organice.200ok.ch/sample">
                        Live demo
                      </a>
                    </div>
                  </div>
                </div>
                <div className="svg-border-rounded text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 144.54 17.34"
                    preserveAspectRatio="none"
                    fill="currentColor"
                  >
                    <path d="M144.54,17.34H0V0H144.54ZM0,0S32.36,17.34,72.27,17.34,144.54,0,144.54,0"></path>
                  </svg>
                </div>
              </section>

              <section className="bg-light py-10">
                <div className="container px-5 mt-5">
                  <div className="row gx-5 align-items-center">
                    <div className="col-lg-6">
                      <h4>Do you have further questions?</h4>
                      <p className="lead mb-5 mb-lg-0 text-gray-500">
                        Join the inclusive and friendly community chat, and let's have a talk.
                      </p>
                    </div>
                    <div className="col-lg-6 text-lg-end">
                      <a
                        className="btn btn-primary fw-500 me-3 my-2"
                        href="https://matrix.to/#/#organice:matrix.org"
                      >
                        Matrix
                      </a>

                      <a
                        className="btn btn-white fw-500 my-2 shadow"
                        href="https://web.libera.chat/"
                      >
                        IRC (&#35;organice)
                      </a>
                    </div>
                  </div>
                </div>
              </section>
              <hr className="m-0" />
            </div>
          </main>
        </div>

        <div id="layoutDefault_footer">
          <footer className="footer pt-10 pb-5 mt-auto bg-light footer-light">
            <div className="container px-5">
              <div className="row gx-5">
                <div className="col-lg-3">
                  <div className="footer-brand">200ok GmbH</div>
                  <div className="mb-3">Glarus, Switzerland</div>
                  <div>
                    <a href="tel:+41764050567">
                      <i className="fas fa-phone-square"></i>&nbsp;+41 76 405 05 67
                    </a>
                  </div>
                  <div>
                    <a href="mailto:info@200ok.ch">
                      <i className="fas fa-envelope-square"></i>&nbsp;info@200ok.ch
                    </a>
                  </div>
                </div>
                <div className="col-lg-9">
                  <div className="row gx-5">
                    <div className="col-lg-6">
                      <div className="footer-brand">&nbsp;</div>
                      <div className="mb-3">Follow us on Social Media</div>
                      <div className="icon-list-social mb-5">
                        <a
                          className="icon-list-social-link"
                          target="_blank"
                          href="https://200ok.ch/atom.xml" rel="noreferrer"
                        >
                          <i className="fas fa-rss-square"></i>
                        </a>
                        <a
                          className="icon-list-social-link"
                          target="_blank"
                          href="https://github.com/200ok-ch/" rel="noreferrer"
                        >
                          <i className="fab fa-github"></i>
                        </a>
                        <a
                          className="icon-list-social-link"
                          target="_blank"
                          href="https://www.linkedin.com/in/alafon/" rel="noreferrer"
                        >
                          <i className="fab fa-linkedin"></i>
                        </a>
                        <a
                          className="icon-list-social-link"
                          target="_blank"
                          href="https://twitter.com/munen_200ok" rel="noreferrer"
                        >
                          <i className="fab fa-twitter"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <hr className="my-5" />
              <div className="row gx-5 align-items-center">
                <div className="col-md-6 small">Copyright &copy; 200ok GmbH 2022</div>
                <div className="col-md-6 text-md-end small">
                  <a href="/privacy-policy.html">Privacy Policy</a>
                  &middot;
                  <a href="/terms-of-service.html">Terms &amp; Conditions</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};
