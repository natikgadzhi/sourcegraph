package app

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	htmpl "html/template"
	"net/url"
	"os"

	"golang.org/x/net/context"

	"sourcegraph.com/sourcegraph/appdash"

	"sourcegraph.com/sourcegraph/sourcegraph/app/appconf"
	"sourcegraph.com/sourcegraph/sourcegraph/app/assets"
	"sourcegraph.com/sourcegraph/sourcegraph/app/internal/tmpl"
	"sourcegraph.com/sourcegraph/sourcegraph/auth/idkey"
	"sourcegraph.com/sourcegraph/sourcegraph/cli/buildvar"
	"sourcegraph.com/sourcegraph/sourcegraph/conf"
	"sourcegraph.com/sourcegraph/sourcegraph/util/envutil"
	"sourcegraph.com/sourcegraph/sourcegraph/util/traceutil/appdashctx"
)

func init() {
	for name, fn := range tmplFuncs {
		if _, present := tmpl.FuncMap[name]; present {
			panic("template func already exists: " + name)
		}
		tmpl.FuncMap[name] = fn
	}
}

var tmplFuncs = htmpl.FuncMap{
	"appconf": func() interface{} { return &appconf.Flags },

	"json": func(v interface{}) (string, error) {
		b, err := json.Marshal(v)
		if err != nil {
			return "", err
		}
		return string(b), nil
	},
	"rawJSON": func(v *json.RawMessage) htmpl.JS {
		if v == nil || *v == nil || len(*v) == 0 {
			return "null"
		}
		return htmpl.JS(string(*v))
	},

	"customFeedbackForm": func() htmpl.HTML { return appconf.Flags.CustomFeedbackForm },

	"maxLen": func(maxLen int, s string) string {
		if len(s) <= maxLen {
			return s
		}
		return s[:maxLen]
	},

	"assetURL": assets.URL,

	"getClientIDOrHostName": func(ctx context.Context, appURL *url.URL) string {
		clientID := idkey.FromContext(ctx).ID
		if clientID != "" {
			// return a shortened clientID, to match the clientID logged
			// in eventsutil/events.go:getShortClientID.
			if len(clientID) > 6 {
				return clientID[:6]
			}
			return clientID
		}
		if appURL == nil {
			return "unknown-host"
		}
		return appURL.Host
	},

	"googleAnalyticsTrackingID": func() string { return appconf.Flags.GoogleAnalyticsTrackingID },

	"deployedGitCommitID": func() string { return envutil.GitCommitID },
	"fileSearchDisabled":  func() bool { return appconf.Flags.DisableSearch },

	"publicRavenDSN": func() string { return conf.PublicRavenDSN },

	"urlToAppdashTrace": func(ctx context.Context, trace appdash.ID) *url.URL {
		return appdashctx.AppdashURL(ctx).ResolveReference(&url.URL{
			Path: fmt.Sprintf("/traces/%v", trace),
		})
	},

	"buildvar": func() buildvar.Vars { return buildvar.All },

	"intercomHMAC": func(email string) string {
		mac := hmac.New(sha256.New, []byte(os.Getenv("SG_INTERCOM_SECRET_KEY")))
		mac.Write([]byte(email))
		return string(mac.Sum(nil))
	},
}
