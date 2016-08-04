import React from 'react';

export default function GraphPage (props) {
  return (
    <div>
      <button type="button" class="btn btn-primary">立即刷新</button>
      <table class="table table-striped">
    <thead>
        <tr>
          <th>时间</th>
          <th>经度</th>
          <th>纬度</th>
          <th>速度</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">2016-08-01 20:01:12 PDT</th>
          <td>Mark</td>
          <td>Otto</td>
          <td>@mdo</td>
        </tr>
        <tr>
          <th scope="row">2016-08-02 20:01:12 PDT</th>
          <td>Jacob</td>
          <td>Thornton</td>
          <td>@fat</td>
        </tr>
        <tr>
          <th scope="row">2016-08-03 20:01:12 PDT</th>
          <td>Larry</td>
          <td>the Bird</td>
          <td>@twitter</td>
        </tr>
      </tbody>
    </table>
    </div>
  );
};

GraphPage.propTypes = {};
