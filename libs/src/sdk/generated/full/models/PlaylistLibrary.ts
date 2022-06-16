// @ts-nocheck
/* tslint:disable */
/* eslint-disable */
/**
 * API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface PlaylistLibrary
 */
export interface PlaylistLibrary {
    /**
     * 
     * @type {Array<object>}
     * @memberof PlaylistLibrary
     */
    contents?: Array<object>;
}

export function PlaylistLibraryFromJSON(json: any): PlaylistLibrary {
    return PlaylistLibraryFromJSONTyped(json, false);
}

export function PlaylistLibraryFromJSONTyped(json: any, ignoreDiscriminator: boolean): PlaylistLibrary {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'contents': !exists(json, 'contents') ? undefined : json['contents'],
    };
}

export function PlaylistLibraryToJSON(value?: PlaylistLibrary | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'contents': value.contents,
    };
}

