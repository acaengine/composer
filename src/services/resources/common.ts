/*
* @Author: Alex Sorafumo
* @Date:   2017-05-02 10:39:06
* @Last Modified by:   Alex Sorafumo
* @Last Modified time: 2017-05-02 10:39:40
*/

 const common_headers = {
     'Content-Type': 'application/json',
     'Accept': 'application/json',
 };
 const GET = 'GET';
 const POST = 'POST';
 const PUT = 'PUT';
 const DELETE = 'DELETE';
 const common_crud = {
     // See defaults: http://docs.angularjs.org/api/ngResource.$resource
     get: {
         method: GET,
         headers: common_headers,
     },
     query:  {
         method: GET,
         headers: common_headers,
     },
     save: {
         method: POST,
         headers: common_headers,
     },
     create: {
         method: POST,
         headers: common_headers,
     },
     send: {
         method: POST,
         headers: common_headers,
     },
     update: {
         method: PUT,
         headers: common_headers,
     },
     task: {
         method: POST,
         headers: common_headers,
     },
     remove: {
         method: DELETE,
         headers: common_headers,
     },
     delete: {
         method: DELETE,
         headers: common_headers,
     },
 };
