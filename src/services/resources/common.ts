/*
* @Author: Alex Sorafumo
* @Date:   2017-05-02 10:39:06
* @Last Modified by:   Alex Sorafumo
* @Last Modified time: 2017-05-04 11:57:21
*/

const headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
const GET = 'GET';
const POST = 'POST';
const PUT = 'PUT';
const DELETE = 'DELETE';

export const COMMON = {
    headers,
    cmd: {
        GET,
        POST,
        PUT,
        DELETE,
    },
    crud: {
         // See defaults: http://docs.angularjs.org/api/ngResource.$resource
         get: {
             method: GET,
             headers,
         },
         query:  {
             method: GET,
             headers,
         },
         save: {
             method: POST,
             headers,
         },
         create: {
             method: POST,
             headers,
         },
         send: {
             method: POST,
             headers,
         },
         update: {
             method: PUT,
             headers,
         },
         task: {
             method: POST,
             headers,
         },
         remove: {
             method: DELETE,
             headers,
         },
         delete: {
             method: DELETE,
             headers,
         },
    },
};
