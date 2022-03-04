import React, { Fragment, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams, Link, useHistory } from "react-router-dom";
// import './stylesheet.css';

import { List, Map } from 'immutable';
import { STATIC_FILE_PREFIX } from '../../lib/org_utils';

import parseQueryString from '../../util/parse_query_string';

const Capture = ({
  captureTemplates,
  loadedFilePaths,
  state,
}) => {

  /**
   * Return a list of possible files for a capture template. Some templates
   * force a certain file, some allow a specific whitelist and some allow all
   * files
   */
  const getPossibleFilesForTemplate = (template) => {
    if (!template) {
      return [];
    }

    if (template.get('file')) {
      return [template.get('file')];
    }

    if (!template.get('isAvailableInAllOrgFiles')) {
      return template.get('orgFilesWhereAvailable').toJS();
    }

    return loadedFilePaths.filter(path => !!path);
  };

  /**
   * Render the template selector or the current template
   * 
   * If no template is selected, show the list of all templates and let the user
   * select one. If a template is selected, show the selected template and a
   * button to unselect it
   */
  const renderTemplateSelector = () => {

    if (template) {
      return (
        <div>
          <p>selected template: { template.get('description') }</p>

          <Link
            to={`/capture?${getQueryString()}`}
          >select different template</Link>
        </div>
      );
    }

    return (
      <div>
        <p>select a template:</p>
        <ul>
          {captureTemplates.map((template, index) => (
            <li>
              <Link
                key={template.get('id')}
                to={`/capture/${template.get('description')}?${getQueryString()}`}
              >{template.get('description')}</Link>
            </li>
          ))}
        </ul>
      </div>
    );
    ;
  }

  /**
   * Render the file selector, if a template is selected. Depending on the
   * template, show a dropdown with possible files or just an automatically
   * selected file
   */
  const renderFileSelector = () => {

    if (!template) {
      return null;
    }

    return (
      <select onChange={(e) => setCaptureFile(e.target.value)} style={{ width: '90%' }} value={captureFile}>
        {getPossibleFilesForTemplate(template).map((path) => (
          <option key={path} value={path}>
            {path}
          </option>
        ))}
      </select>
    );
  };

  /**
   * Render the submit button, if submitting is possible
   */
  const renderSubmit = () => {
    if (!template || !captureFile) {
      return null;
    }

    return (
      <button
        onClick={submit}
      >capture {template.get('description')} to {captureFile}</button>
    );
  };

      // TODO just copied from App.js, make it a reusable function
  const getCustomCaptureVariables = () => Map(
    Object.entries(queryStringContents)
      .map(([key, value]) => {
        const CUSTOM_VARIABLE_PREFIX = 'captureVariable_';
        if (key.startsWith(CUSTOM_VARIABLE_PREFIX)) {
          return [key.substring(CUSTOM_VARIABLE_PREFIX.length), value];
        }

        return null;
      })
      .filter((item) => !!item)
  );

  /**
   * Submit the capture. Update the state with target file, capture template &
   * contents, and redirect to the target file. The actual capture is handled there
   */
  const submit = () => {

    let customCaptureVariables = getCustomCaptureVariables();

    state.org.present = state.org.present.set(
      'pendingCapture',
      Map({
        capturePath: captureFile,
        captureTemplateName: template.get("description"),
        captureContent: captureContent,
        customCaptureVariables,
      })
    );

    history.push(`/file${captureFile}`);
  };

  const history = useHistory();

  // get the template from the router
  const templateName = useParams().template;
  const template = captureTemplates
      .find((template) => template.get('description').trim() === templateName);

  const queryStringContents = parseQueryString(window.location.search);

  let captureFilename = queryStringContents.captureFile;
  if (template && template.get('file')) {
    captureFilename = template.get('file');
  }

  const [captureFile, setCaptureFile] = useState(captureFilename);
  const captureContent = queryStringContents.captureContent;

  const getQueryString = (additionalParams = {}) => new URLSearchParams({...queryStringContents, ...additionalParams});

  // whenever the template changes (by router navigation), reset the capture
  // file to the first possible one
  useEffect(() => {
    setCaptureFile(getPossibleFilesForTemplate(template)[0]);
  }, [template]);

  return (
    <div>
      <h1>Capture</h1>

      <h2>Template</h2>
      { renderTemplateSelector() }

      <h2>Target file</h2>
      { renderFileSelector() }

      <p>
      { renderSubmit() }
      </p>

    </div>
  );
};

const mapStateToProps = (state) => {

  const loadedFilePaths = state.org.present
    .get('files', List())
    .keySeq()
    .toJS()
    .filter((path) => !path.startsWith(STATIC_FILE_PREFIX));
  loadedFilePaths.unshift('');
  return {
    captureTemplates: state.capture.get('captureTemplates', List()),
    loadedFilePaths,
    state,
  };
};

export default connect(mapStateToProps)(Capture);
